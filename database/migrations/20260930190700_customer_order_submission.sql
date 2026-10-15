begin;
alter table public.orders add column payment_due_at timestamptz,
  add column payment_instructions jsonb;
alter table public.payment_transactions add column customer_payment_reference text;

create function private.submit_customer_order(p_payload jsonb,p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor uuid := auth.uid();
  store_uuid uuid := (p_payload->>'store_id')::uuid;
  settings public.store_settings%rowtype;
  existing public.orders%rowtype;
  result jsonb;
  deadline timestamptz;
  instructions jsonb;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception using errcode='42501',message='Inicia sesión para crear tu pedido';
  end if;
  if p_operation_id is null then raise exception using errcode='22023',message='Falta el identificador de operación'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  select * into existing from public.orders where store_id=store_uuid and operation_id=p_operation_id;
  if found then
    if existing.requester_user_id<>actor then raise exception using errcode='42501',message='Operación de otra cuenta'; end if;
    return jsonb_build_object('order_id',existing.id,'order_number',existing.order_number,'status',existing.status,
      'payment_status',existing.payment_status,'estimated_total_cents',existing.estimated_total_cents,
      'reservation_expires_at',existing.payment_due_at,'idempotent_replay',true);
  end if;
  select * into strict settings from public.store_settings where store_id=store_uuid for share;
  if p_payload->>'payment_method' in ('yape','plin') then
    if settings.manual_payment_window_minutes is null then raise exception using errcode='P0001',message='Falta configurar el plazo de pago'; end if;
    deadline:=statement_timestamp()+pg_catalog.make_interval(mins=>settings.manual_payment_window_minutes);
    instructions:=case p_payload->>'payment_method'
      when 'yape' then jsonb_build_object('name',settings.yape_recipient_name,'phone',settings.yape_recipient_phone)
      else jsonb_build_object('name',settings.plin_recipient_name,'phone',settings.plin_recipient_phone) end;
    if nullif(instructions->>'name','') is null or nullif(instructions->>'phone','') is null then
      raise exception using errcode='P0001',message='Falta configurar el destinatario del pago'; end if;
  elsif p_payload->>'payment_method'='cash' and p_payload->>'fulfillment_type'='pickup' then
    -- Cash has no digital payment deadline. Explicit cancellation/fulfillment releases stock.
    deadline:=null;
  else raise exception using errcode='22023',message='Método de pago no disponible'; end if;
  result:=private.create_checkout_order(p_payload,p_operation_id,coalesce(deadline,'infinity'::timestamptz));
  update public.orders set payment_due_at=deadline,payment_instructions=instructions
    where id=(result->>'order_id')::uuid;
  return result || jsonb_build_object('reservation_expires_at',deadline);
end $$;
revoke all on function private.submit_customer_order(jsonb,uuid) from public;
grant execute on function private.submit_customer_order(jsonb,uuid) to authenticated;
create function public.submit_customer_order(p_payload jsonb,p_operation_id uuid)
returns jsonb language sql security invoker set search_path=''
begin atomic select private.submit_customer_order(p_payload,p_operation_id); end;
revoke all on function public.submit_customer_order(jsonb,uuid) from public;
grant execute on function public.submit_customer_order(jsonb,uuid) to authenticated;

-- Preserve older client signatures, but deadlines can no longer be client-controlled.
create or replace function public.create_checkout_order(p_payload jsonb,p_operation_id uuid,p_reservation_expires_at timestamptz)
returns jsonb language sql security invoker set search_path=''
begin atomic select private.submit_customer_order(p_payload,p_operation_id); end;
revoke execute on function private.create_checkout_order(jsonb,uuid,timestamptz) from authenticated,anon;

create function private.protect_confirmed_payment_reservations()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.payment_status='paid' and old.payment_status is distinct from new.payment_status then
    perform 1 from public.inventory_reservations where order_id=new.id order by id for update;
    if exists(select 1 from public.inventory_reservations where order_id=new.id
      and (status='expired' or (status in ('reserved','partially_consumed') and expires_at<=statement_timestamp()))) then
      raise exception using errcode='P0001',message='La reserva venció; revisa el pago antes de confirmar';
    end if;
    update public.inventory_reservations set expires_at='infinity'::timestamptz
      where order_id=new.id and status in ('reserved','partially_consumed');
  end if;
  return new;
end $$;
revoke all on function private.protect_confirmed_payment_reservations() from public,anon,authenticated;
create trigger protect_confirmed_payment_reservations before update of payment_status on public.orders
for each row execute function private.protect_confirmed_payment_reservations();

create function private.report_customer_payment(p_order_id uuid,p_reference text)
returns void language plpgsql security definer set search_path='' as $$
declare purchase public.orders%rowtype; tx public.payment_transactions%rowtype;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception using errcode='42501',message='Inicia sesión'; end if;
  select * into purchase from public.orders where id=p_order_id and requester_user_id=auth.uid() for update;
  if not found then raise exception using errcode='42501',message='Pedido no disponible'; end if;
  if length(btrim(coalesce(p_reference,''))) not between 4 and 100 then
    raise exception using errcode='22023',message='Escribe la referencia de tu transferencia'; end if;
  select * into tx from public.payment_transactions where order_id=p_order_id
    and transaction_type='charge' and method in ('yape','plin') order by created_at limit 1 for update;
  if not found then raise exception using errcode='P0001',message='Pago no disponible'; end if;
  if tx.status in ('processing','succeeded') then return; end if;
  if purchase.status<>'pending_payment' or purchase.payment_due_at is null or purchase.payment_due_at<=statement_timestamp() then
    raise exception using errcode='P0001',message='El plazo de pago venció. Contacta a la tienda si ya pagaste'; end if;
  perform 1 from public.inventory_reservations where order_id=p_order_id order by id for update;
  if exists(select 1 from public.inventory_reservations where order_id=p_order_id and (status='expired' or expires_at<=statement_timestamp())) then
    raise exception using errcode='P0001',message='La reserva venció. Contacta a la tienda si ya pagaste'; end if;
  update public.payment_transactions set customer_payment_reference=btrim(p_reference),status='processing'
    where id=tx.id;
  -- An unverified reference never credits money. Staff review or cancellation releases the hold.
  update public.inventory_reservations set expires_at='infinity'::timestamptz
    where order_id=p_order_id and status in ('reserved','partially_consumed');
  perform private.refresh_order_payment_status(purchase.store_id,p_order_id);
end $$;
revoke all on function private.report_customer_payment(uuid,text) from public;
grant execute on function private.report_customer_payment(uuid,text) to authenticated;
create function public.report_customer_payment(p_order_id uuid,p_reference text)
returns void language sql security invoker set search_path=''
begin atomic select private.report_customer_payment(p_order_id,p_reference); end;
revoke all on function public.report_customer_payment(uuid,text) from public;
grant execute on function public.report_customer_payment(uuid,text) to authenticated;
commit;
