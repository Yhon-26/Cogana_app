CREATE OR REPLACE FUNCTION private.transition_order(p_store_id uuid, p_order_id uuid, p_to_status text, p_operation_id uuid, p_reason_code text DEFAULT NULL::text, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor uuid := (select auth.uid());
  v_order public.orders%rowtype;
  v_history public.order_status_history%rowtype;
  v_reservation record;
begin
  if v_actor is null or not private.has_store_role(p_store_id, array['owner','admin']) then
    raise exception using errcode = '42501', message = 'No autorizado para cambiar el pedido';
  end if;
  if p_operation_id is null then
    raise exception using errcode = '22023', message = 'operation_id es obligatorio';
  end if;

  select * into v_history
  from public.order_status_history
  where store_id = p_store_id and operation_id = p_operation_id;
  if found then
    if v_history.order_id <> p_order_id or v_history.to_status <> p_to_status then
      raise exception using errcode = '23505', message = 'operation_id ya utilizado';
    end if;
    return jsonb_build_object('order_id', p_order_id, 'status', p_to_status, 'idempotent_replay', true);
  end if;

  select * into v_order
  from public.orders
  where store_id = p_store_id and id = p_order_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'Pedido no encontrado';
  end if;
  if v_order.status in ('completed', 'cancelled') then
    raise exception using errcode = 'P0001', message = 'El pedido ya está finalizado';
  end if;

  if not (
    (v_order.status = 'pending_payment' and p_to_status in ('queued','cancelled'))
    or (v_order.status = 'queued' and p_to_status in ('confirmed','cancelled'))
    or (v_order.status = 'confirmed' and p_to_status in ('preparing','cancelled'))
    or (v_order.status = 'preparing' and p_to_status in ('awaiting_adjustment','ready_for_pickup','ready_for_delivery','cancelled'))
    or (v_order.status = 'awaiting_adjustment' and p_to_status in ('preparing','cancelled'))
    or (v_order.status = 'ready_for_delivery' and p_to_status in ('out_for_delivery','cancelled'))
    or (v_order.status = 'ready_for_pickup' and p_to_status in ('completed','cancelled'))
    or (v_order.status = 'out_for_delivery' and p_to_status in ('completed','cancelled'))
  ) then
    raise exception using errcode = 'P0001', message = 'Transición de pedido no permitida';
  end if;

  if p_to_status='completed' then
    raise exception using errcode='P0001',message='Completa mediante el código de recojo o entrega';
  end if;
  if p_to_status in ('queued','confirmed','preparing','ready_for_delivery','out_for_delivery','ready_for_pickup')
    and v_order.payment_status<>'paid' and not (v_order.fulfillment_type='pickup' and v_order.payment_method='cash') then
    raise exception using errcode='P0001',message='Verifica el pago antes de avanzar el pedido';
  end if;
  if p_to_status in ('ready_for_delivery','out_for_delivery','ready_for_pickup') then
    perform private.assert_order_prepared(p_store_id,p_order_id);
    if (p_to_status='ready_for_pickup' and v_order.fulfillment_type<>'pickup')
      or (p_to_status in ('ready_for_delivery','out_for_delivery') and v_order.fulfillment_type<>'delivery') then
      raise exception using errcode='22023',message='El estado no corresponde al tipo de entrega';
    end if;
  end if;
  if p_to_status='out_for_delivery' then
    if not exists(select 1 from public.delivery_assignments where store_id=p_store_id and order_id=p_order_id
      and driver_user_id is not null and status in ('assigned','accepted','picked_up','delivering')) then
      raise exception using errcode='P0001',message='Asigna un repartidor antes de iniciar la entrega';
    end if;
    update public.delivery_assignments set status='delivering',started_at=coalesce(started_at,statement_timestamp())
      where store_id=p_store_id and order_id=p_order_id and status in ('assigned','accepted','picked_up');
  end if;
  if p_to_status = 'cancelled' then
    if exists(select 1 from public.payment_transactions where store_id=p_store_id and order_id=p_order_id and transaction_type='charge' and status='processing') then
      raise exception using errcode='P0001',message='Confirma o rechaza la referencia de pago antes de cancelar'; end if;
    if nullif(btrim(p_reason_code),'') is null then raise exception using errcode='22023',message='Indica el motivo de cancelación'; end if;
    update public.payment_transactions set status='cancelled',updated_at=statement_timestamp()
      where store_id=p_store_id and order_id=p_order_id and transaction_type in ('charge','adjustment')
        and status in ('pending','requires_action','processing');
    perform private.create_payment_operation(p_store_id,p_order_id,null,'refund',v_order.payment_method,'pending_refund',
      'cancel:'||p_order_id::text,net.amount::bigint,'pending') from (
      select coalesce(sum(case when transaction_type in ('charge','adjustment') and status='succeeded' then amount_cents
        when transaction_type='refund' and status in ('succeeded','pending','processing','requires_action') then -amount_cents else 0 end),0) amount
      from public.payment_transactions where store_id=p_store_id and order_id=p_order_id
    ) net where net.amount>0;
    update public.delivery_assignments set status='cancelled' where store_id=p_store_id and order_id=p_order_id and status<>'delivered';
    for v_reservation in
      select r.id from public.inventory_reservations r
      where r.store_id = p_store_id and r.order_id = p_order_id
        and r.status in ('reserved', 'partially_consumed')
      order by r.id
      for update
    loop
      perform private.release_reservation_internal(v_reservation.id, 'released', statement_timestamp());
    end loop;
  end if;

  update public.orders
  set status = p_to_status,
      payment_status = case when p_to_status='cancelled' and not exists(select 1 from public.payment_transactions where store_id=p_store_id and order_id=p_order_id and status='succeeded' and transaction_type in ('charge','adjustment')) then 'cancelled' else payment_status end,
      cancellation_reason_code = case when p_to_status = 'cancelled' then p_reason_code else cancellation_reason_code end,
      cancelled_at = case when p_to_status = 'cancelled' then statement_timestamp() else cancelled_at end,
      completed_at = case when p_to_status = 'completed' then statement_timestamp() else completed_at end,
      updated_at = statement_timestamp()
  where store_id = p_store_id and id = p_order_id;

  insert into public.order_status_history (
    store_id, order_id, from_status, to_status, reason_code, note,
    actor_user_id, operation_id
  ) values (
    p_store_id, p_order_id, v_order.status, p_to_status, p_reason_code, p_note,
    v_actor, p_operation_id
  );

  return jsonb_build_object('order_id', p_order_id, 'status', p_to_status, 'idempotent_replay', false);
end;
$function$;

create or replace function private.cancel_customer_order(p_order_id uuid,p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare ord public.orders%rowtype; actor uuid:=auth.uid(); result jsonb; reservation record;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception using errcode='42501',message='Inicia sesión'; end if;
  select * into ord from public.orders where id=p_order_id and requester_user_id=actor for update;
  if not found then raise exception using errcode='42501',message='Pedido no disponible'; end if;
  perform private.guard_commerce_operation(ord.store_id,p_operation_id,'cancel_customer_order',p_order_id);
  select l.result into result from private.operation_log l where operation_id=p_operation_id;
  if found then return result||jsonb_build_object('idempotent_replay',true); end if;
  if ord.status<>'pending_payment' or exists(select 1 from public.payment_transactions where store_id=ord.store_id and order_id=ord.id and status in ('processing','succeeded')) then
    raise exception using errcode='P0001',message='La tienda debe revisar la cancelación de un pedido pagado o en revisión'; end if;
  for reservation in select id from public.inventory_reservations where store_id=ord.store_id and order_id=ord.id and status in ('reserved','partially_consumed') order by id for update loop
    perform private.release_reservation_internal(reservation.id,'released',statement_timestamp());
  end loop;
  update public.payment_transactions set status='cancelled',updated_at=statement_timestamp() where store_id=ord.store_id and order_id=ord.id and status in ('pending','requires_action');
  update public.orders set status='cancelled',payment_status='cancelled',cancellation_reason_code='customer_cancelled',cancelled_at=statement_timestamp() where id=ord.id;
  insert into public.order_status_history(store_id,order_id,from_status,to_status,reason_code,actor_user_id,operation_id)
    values(ord.store_id,ord.id,ord.status,'cancelled','customer_cancelled',actor,p_operation_id);
  result:=jsonb_build_object('order_id',ord.id,'status','cancelled');
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result) values(p_operation_id,ord.store_id,'cancel_customer_order',actor,result);
  return result;
end; $$;

CREATE OR REPLACE FUNCTION private.refresh_order_payment_status(p_store_id uuid, p_order_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  if v_order.status='cancelled' and v_charged=0 then
    v_status:='cancelled';
  elsif v_charged > 0 and v_refunded >= v_charged then
    v_status := 'refunded';
  elsif v_charged-v_refunded>=v_target and v_order.status<>'cancelled' then
    v_status := 'paid';
  elsif v_refunded>0 then
    v_status := 'partially_refunded';
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
$function$;