-- Abstracción de pagos y preparación final de artículos por peso.

create table if not exists private.operation_log (
  operation_id uuid primary key,
  store_id uuid not null,
  operation_kind text not null,
  actor_user_id uuid,
  result jsonb not null,
  created_at timestamptz not null default now()
);
alter table private.operation_log enable row level security;
revoke all on table private.operation_log from public, anon, authenticated, service_role;

create or replace function private.refresh_order_payment_status(
  p_store_id uuid,
  p_order_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_charged bigint;
  v_refunded bigint;
  v_pending boolean;
  v_target bigint;
  v_status text;
begin
  select * into v_order from public.orders
  where store_id = p_store_id and id = p_order_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'Pedido no encontrado';
  end if;

  select
    coalesce(sum(amount_cents) filter (
      where status = 'succeeded' and transaction_type in ('charge','adjustment')
    ), 0),
    coalesce(sum(amount_cents) filter (
      where status = 'succeeded' and transaction_type = 'refund'
    ), 0),
    coalesce(bool_or(status in ('pending','requires_action','processing')), false)
  into v_charged, v_refunded, v_pending
  from public.payment_transactions
  where store_id = p_store_id and order_id = p_order_id;

  v_target := coalesce(v_order.final_total_cents, v_order.estimated_total_cents);
  if v_charged > 0 and v_refunded >= v_charged then
    v_status := 'refunded';
  elsif v_refunded > 0 then
    v_status := 'partially_refunded';
  elsif v_charged - v_refunded >= v_target then
    v_status := 'paid';
  elsif v_pending then
    v_status := case when exists (
      select 1 from public.payment_transactions
      where store_id = p_store_id and order_id = p_order_id
        and status = 'requires_action'
    ) then 'requires_action' else 'processing' end;
  elsif exists (
    select 1 from public.payment_transactions
    where store_id = p_store_id and order_id = p_order_id and status = 'failed'
  ) then
    v_status := 'failed';
  else
    v_status := 'pending';
  end if;

  update public.orders
  set payment_status = v_status,
      status = case when v_status = 'paid' and status = 'pending_payment' then 'queued' else status end,
      updated_at = statement_timestamp()
  where store_id = p_store_id and id = p_order_id;

  if v_status = 'paid' and v_order.status = 'pending_payment' then
    insert into public.order_status_history (
      store_id, order_id, from_status, to_status, reason_code, operation_id
    ) values (
      p_store_id, p_order_id, 'pending_payment', 'queued', 'payment_confirmed', gen_random_uuid()
    );
  end if;
  return v_status;
end;
$$;

create or replace function private.confirm_manual_payment(
  p_store_id uuid,
  p_order_id uuid,
  p_transaction_id uuid,
  p_operation_id uuid,
  p_provider_reference text,
  p_proof_storage_path text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_tx public.payment_transactions%rowtype;
  v_result jsonb;
  v_status text;
begin
  if v_actor is null or not private.has_store_role(p_store_id, array['owner','admin']) then
    raise exception using errcode = '42501', message = 'No autorizado para confirmar pagos';
  end if;
  select result into v_result from private.operation_log
  where operation_id = p_operation_id and store_id = p_store_id
    and operation_kind = 'confirm_manual_payment';
  if found then return v_result || jsonb_build_object('idempotent_replay', true); end if;

  select * into v_tx from public.payment_transactions
  where store_id = p_store_id and id = p_transaction_id and order_id = p_order_id
  for update;
  if not found or v_tx.method not in ('yape','plin')
     or v_tx.provider not in ('manual_yape','manual_plin') then
    raise exception using errcode = 'P0001', message = 'Transacción manual no encontrada';
  end if;
  if v_tx.status not in ('pending','requires_action','processing','succeeded') then
    raise exception using errcode = 'P0001', message = 'La transacción no puede confirmarse';
  end if;

  insert into public.payment_events (
    provider, provider_event_id, event_type, payload, signature_valid, processed_at
  ) values (
    'manual', p_operation_id::text, 'manual_payment_confirmed',
    jsonb_build_object('transaction_id',p_transaction_id,'actor_user_id',v_actor),
    true, statement_timestamp()
  ) on conflict (provider, provider_event_id) do nothing;

  update public.payment_transactions
  set status = 'succeeded',
      provider_reference = coalesce(nullif(p_provider_reference,''), provider_reference),
      proof_storage_path = coalesce(nullif(p_proof_storage_path,''), proof_storage_path),
      processed_at = coalesce(processed_at, statement_timestamp()),
      updated_at = statement_timestamp()
  where id = p_transaction_id;

  v_status := private.refresh_order_payment_status(p_store_id, p_order_id);
  v_result := jsonb_build_object(
    'transaction_id', p_transaction_id,
    'transaction_status', 'succeeded',
    'order_payment_status', v_status,
    'idempotent_replay', false
  );
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result)
  values(p_operation_id,p_store_id,'confirm_manual_payment',v_actor,v_result);
  return v_result;
end;
$$;

create or replace function private.record_payment_event(
  p_provider text,
  p_provider_event_id text,
  p_event_type text,
  p_payload jsonb,
  p_signature_valid boolean,
  p_transaction_id uuid default null,
  p_new_status text default null,
  p_provider_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_inserted boolean;
  v_tx public.payment_transactions%rowtype;
  v_order_status text;
begin
  if btrim(coalesce(p_provider,'')) = '' or btrim(coalesce(p_provider_event_id,'')) = '' then
    raise exception using errcode = '22023', message = 'Proveedor y event_id son obligatorios';
  end if;
  insert into public.payment_events(
    provider,provider_event_id,event_type,payload,signature_valid
  ) values (
    p_provider,p_provider_event_id,p_event_type,coalesce(p_payload,'{}'::jsonb),p_signature_valid
  )
  on conflict (provider,provider_event_id) do nothing
  returning id into v_event_id;
  v_inserted := found;
  if not v_inserted then
    select id into v_event_id from public.payment_events
    where provider=p_provider and provider_event_id=p_provider_event_id;
    return jsonb_build_object('event_id',v_event_id,'processed',false,'idempotent_replay',true);
  end if;

  if not p_signature_valid then
    update public.payment_events
    set processed_at=statement_timestamp(), processing_error='invalid_signature'
    where id=v_event_id;
    return jsonb_build_object('event_id',v_event_id,'processed',false,'reason','invalid_signature','idempotent_replay',false);
  end if;
  if p_transaction_id is null or p_new_status is null then
    update public.payment_events set processed_at=statement_timestamp() where id=v_event_id;
    return jsonb_build_object('event_id',v_event_id,'processed',true,'idempotent_replay',false);
  end if;
  if p_new_status not in ('pending','requires_action','processing','succeeded','failed','cancelled','expired') then
    raise exception using errcode='22023', message='Estado de transacción inválido';
  end if;

  select * into v_tx from public.payment_transactions where id=p_transaction_id for update;
  if not found or v_tx.provider <> p_provider then
    raise exception using errcode='P0001', message='Transacción de proveedor no encontrada';
  end if;
  update public.payment_transactions
  set status=p_new_status,
      provider_reference=coalesce(nullif(p_provider_reference,''),provider_reference),
      processed_at=case when p_new_status in ('succeeded','failed','cancelled','expired') then statement_timestamp() else processed_at end,
      updated_at=statement_timestamp()
  where id=p_transaction_id;
  v_order_status := private.refresh_order_payment_status(v_tx.store_id,v_tx.order_id);
  update public.payment_events set processed_at=statement_timestamp() where id=v_event_id;
  return jsonb_build_object('event_id',v_event_id,'processed',true,'transaction_status',p_new_status,
    'order_payment_status',v_order_status,'idempotent_replay',false);
exception when others then
  if v_event_id is not null then
    update public.payment_events
    set processed_at=statement_timestamp(), processing_error=sqlstate||':'||sqlerrm
    where id=v_event_id;
  end if;
  raise;
end;
$$;

create or replace function private.create_payment_operation(
  p_store_id uuid,
  p_order_id uuid,
  p_parent_transaction_id uuid,
  p_transaction_type text,
  p_method text,
  p_provider text,
  p_idempotency_key text,
  p_amount_cents bigint,
  p_status text default 'pending'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  if p_transaction_type not in ('charge','refund','adjustment')
     or p_method not in ('cash','yape','plin','card')
     or p_status not in ('pending','requires_action','processing','succeeded','failed','cancelled','expired')
     or p_amount_cents <= 0 then
    raise exception using errcode='22023', message='Operación de pago inválida';
  end if;
  insert into public.payment_transactions(
    store_id,order_id,parent_transaction_id,transaction_type,method,provider,
    idempotency_key,amount_cents,status
  ) values (
    p_store_id,p_order_id,p_parent_transaction_id,p_transaction_type,p_method,p_provider,
    p_idempotency_key,p_amount_cents,p_status
  )
  on conflict(store_id,idempotency_key) do update
    set idempotency_key=excluded.idempotency_key
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function private.finalize_weighted_order(
  p_store_id uuid,
  p_order_id uuid,
  p_items jsonb,
  p_operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_order public.orders%rowtype;
  v_item public.order_items%rowtype;
  v_input record;
  v_res public.inventory_reservations%rowtype;
  v_alloc record;
  v_remaining bigint;
  v_take bigint;
  v_units bigint;
  v_line bigint;
  v_discount bigint;
  v_subtotal bigint := 0;
  v_discount_total bigint := 0;
  v_final_total bigint;
  v_paid_net bigint;
  v_adjustment bigint;
  v_result jsonb;
  v_count integer;
begin
  if v_actor is null or not private.has_store_role(p_store_id,array['owner','admin']) then
    raise exception using errcode='42501', message='No autorizado para finalizar preparación';
  end if;
  select result into v_result from private.operation_log
  where operation_id=p_operation_id and store_id=p_store_id and operation_kind='finalize_weighted_order';
  if found then return v_result||jsonb_build_object('idempotent_replay',true); end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then
    raise exception using errcode='22023', message='Debe indicar cantidades preparadas';
  end if;

  select * into v_order from public.orders
  where store_id=p_store_id and id=p_order_id for update;
  if not found or v_order.status not in ('preparing','awaiting_adjustment') then
    raise exception using errcode='P0001', message='El pedido no está en preparación';
  end if;
  select count(*) into v_count from public.order_items where store_id=p_store_id and order_id=p_order_id;
  if v_count<>jsonb_array_length(p_items) then
    raise exception using errcode='22023', message='Debe finalizar todos los artículos del pedido';
  end if;

  for v_input in
    select x.* from jsonb_to_recordset(p_items) as x(order_item_id uuid,prepared_quantity bigint)
    order by x.order_item_id
  loop
    select * into v_item from public.order_items
    where store_id=p_store_id and order_id=p_order_id and id=v_input.order_item_id
    for update;
    if not found or v_input.prepared_quantity is null or v_input.prepared_quantity<0 then
      raise exception using errcode='22023', message='Cantidad preparada inválida';
    end if;
    select * into v_res from public.inventory_reservations
    where store_id=p_store_id and order_item_id=v_item.id for update;
    if not found or v_res.status not in ('reserved','partially_consumed')
       or v_input.prepared_quantity>v_res.reserved_quantity then
      raise exception using errcode='P0001', message='La cantidad preparada excede la reserva';
    end if;

    v_remaining:=v_input.prepared_quantity;
    for v_alloc in
      select a.*, l.product_id
      from public.inventory_reservation_allocations a
      join public.inventory_lots l on l.store_id=a.store_id and l.id=a.lot_id
      where a.store_id=p_store_id and a.reservation_id=v_res.id
      order by a.id
      for update of a,l
    loop
      exit when v_remaining=0;
      v_take:=least(v_remaining,v_alloc.allocated_base_quantity);
      if v_alloc.package_presentation_id is null then
        update public.inventory_lots
        set loose_on_hand_quantity=loose_on_hand_quantity-v_take,updated_at=statement_timestamp()
        where store_id=p_store_id and id=v_alloc.lot_id and loose_on_hand_quantity>=v_take;
        if not found then raise exception using errcode='P0001', message='Stock a granel cambió durante la preparación'; end if;
        insert into public.inventory_movements(
          store_id,product_id,lot_id,movement_type,base_quantity_delta,loose_quantity_delta,
          sealed_units_delta,reference_type,reference_id,operation_id,actor_user_id
        ) values (p_store_id,v_item.product_id,v_alloc.lot_id,'sale',-v_take,-v_take,0,
          'order_item',v_item.id,gen_random_uuid(),v_actor);
      else
        select pp.base_quantity into v_units
        from public.product_presentations pp
        where pp.store_id=p_store_id and pp.id=v_alloc.package_presentation_id;
        if v_take%v_units<>0 then raise exception using errcode='22023', message='Una presentación sellada no puede fraccionarse'; end if;
        v_units:=v_take/v_units;
        update public.inventory_lot_packages
        set sealed_on_hand_units=sealed_on_hand_units-v_units,updated_at=statement_timestamp()
        where store_id=p_store_id and lot_id=v_alloc.lot_id
          and presentation_id=v_alloc.package_presentation_id
          and sealed_on_hand_units>=v_units;
        if not found then raise exception using errcode='P0001', message='Stock sellado cambió durante la preparación'; end if;
        insert into public.inventory_movements(
          store_id,product_id,lot_id,presentation_id,movement_type,base_quantity_delta,
          loose_quantity_delta,sealed_units_delta,reference_type,reference_id,operation_id,actor_user_id
        ) values (p_store_id,v_item.product_id,v_alloc.lot_id,v_alloc.package_presentation_id,
          'sale',-v_take,0,-v_units,'order_item',v_item.id,gen_random_uuid(),v_actor);
      end if;
      v_remaining:=v_remaining-v_take;
    end loop;
    if v_remaining<>0 then raise exception using errcode='P0001', message='Asignaciones incompletas'; end if;

    v_line:=(v_input.prepared_quantity*v_item.price_cents_snapshot+v_item.pricing_quantity_snapshot/2)
      /v_item.pricing_quantity_snapshot;
    v_discount:=least(v_item.estimated_discount_cents,v_line);
    update public.order_items set prepared_quantity=v_input.prepared_quantity,
      final_line_cents=v_line,final_discount_cents=v_discount,updated_at=statement_timestamp()
    where id=v_item.id;
    update public.inventory_reservations set consumed_quantity=v_input.prepared_quantity,
      status='consumed',consumed_at=statement_timestamp(),
      released_at=case when v_input.prepared_quantity<reserved_quantity then statement_timestamp() else released_at end,
      updated_at=statement_timestamp()
    where id=v_res.id;
    v_subtotal:=v_subtotal+v_line;
    v_discount_total:=v_discount_total+v_discount;
  end loop;

  v_final_total:=v_subtotal-v_discount_total+v_order.delivery_fee_cents-v_order.delivery_discount_cents;
  select coalesce(sum(case transaction_type when 'refund' then -amount_cents else amount_cents end),0)
  into v_paid_net from public.payment_transactions
  where store_id=p_store_id and order_id=p_order_id and status='succeeded';
  v_adjustment:=v_final_total-v_paid_net;

  update public.orders set final_subtotal_cents=v_subtotal,final_discount_cents=v_discount_total,
    final_total_cents=v_final_total,
    status=case when v_adjustment>0 and v_paid_net>0 then 'awaiting_adjustment' else 'preparing' end,
    updated_at=statement_timestamp()
  where store_id=p_store_id and id=p_order_id;

  if v_adjustment>0 and v_paid_net>0 then
    perform private.create_payment_operation(p_store_id,p_order_id,null,'adjustment',v_order.payment_method,
      'pending_adjustment','weight:'||p_operation_id::text,v_adjustment,'pending');
    insert into public.order_status_history(store_id,order_id,from_status,to_status,reason_code,actor_user_id,operation_id)
    values(p_store_id,p_order_id,v_order.status,'awaiting_adjustment','weight_difference',v_actor,gen_random_uuid());
  elsif v_adjustment<0 and v_paid_net>0 then
    perform private.create_payment_operation(p_store_id,p_order_id,null,'refund',v_order.payment_method,
      'pending_refund','weight:'||p_operation_id::text,abs(v_adjustment),'pending');
  end if;

  v_result:=jsonb_build_object('order_id',p_order_id,'final_total_cents',v_final_total,
    'paid_net_cents',v_paid_net,'difference_cents',v_adjustment,
    'status',case when v_adjustment>0 and v_paid_net>0 then 'awaiting_adjustment' else 'preparing' end,
    'idempotent_replay',false);
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result)
  values(p_operation_id,p_store_id,'finalize_weighted_order',v_actor,v_result);
  return v_result;
end;
$$;

create or replace function public.confirm_manual_payment(
  p_store_id uuid,p_order_id uuid,p_transaction_id uuid,p_operation_id uuid,
  p_provider_reference text,p_proof_storage_path text default null
)
returns jsonb language sql security invoker set search_path=''
as $$ select private.confirm_manual_payment($1,$2,$3,$4,$5,$6); $$;

create or replace function public.finalize_weighted_order(
  p_store_id uuid,p_order_id uuid,p_items jsonb,p_operation_id uuid
)
returns jsonb language sql security invoker set search_path=''
as $$ select private.finalize_weighted_order($1,$2,$3,$4); $$;

revoke all on function private.refresh_order_payment_status(uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function private.confirm_manual_payment(uuid,uuid,uuid,uuid,text,text) from public,anon;
revoke all on function private.record_payment_event(text,text,text,jsonb,boolean,uuid,text,text) from public,anon,authenticated;
revoke all on function private.create_payment_operation(uuid,uuid,uuid,text,text,text,text,bigint,text) from public,anon,authenticated;
revoke all on function private.finalize_weighted_order(uuid,uuid,jsonb,uuid) from public,anon;
revoke all on function public.confirm_manual_payment(uuid,uuid,uuid,uuid,text,text) from public,anon;
revoke all on function public.finalize_weighted_order(uuid,uuid,jsonb,uuid) from public,anon;

grant execute on function private.confirm_manual_payment(uuid,uuid,uuid,uuid,text,text) to authenticated,service_role;
grant execute on function private.record_payment_event(text,text,text,jsonb,boolean,uuid,text,text) to service_role;
grant execute on function private.create_payment_operation(uuid,uuid,uuid,text,text,text,text,bigint,text) to service_role;
grant execute on function private.finalize_weighted_order(uuid,uuid,jsonb,uuid) to authenticated,service_role;
grant execute on function public.confirm_manual_payment(uuid,uuid,uuid,uuid,text,text) to authenticated;
grant execute on function public.finalize_weighted_order(uuid,uuid,jsonb,uuid) to authenticated;
