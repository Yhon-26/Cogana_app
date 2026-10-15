-- Ciclo de inventario: apertura de paquetes, liberación/vencimiento y estados.

create or replace function private.open_inventory_package(
  p_store_id uuid,
  p_lot_id uuid,
  p_presentation_id uuid,
  p_units bigint,
  p_operation_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_package public.inventory_lot_packages%rowtype;
  v_lot public.inventory_lots%rowtype;
  v_presentation public.product_presentations%rowtype;
  v_base_quantity bigint;
  v_existing public.inventory_movements%rowtype;
begin
  if v_actor is null or not private.has_store_role(p_store_id, array['owner','admin']) then
    raise exception using errcode = '42501', message = 'No autorizado para abrir paquetes';
  end if;
  if p_units <= 0 or p_operation_id is null then
    raise exception using errcode = '22023', message = 'Unidades y operation_id son obligatorios';
  end if;

  select * into v_existing
  from public.inventory_movements
  where store_id = p_store_id and operation_id = p_operation_id;
  if found then
    if v_existing.movement_type <> 'open_package'
       or v_existing.lot_id <> p_lot_id
       or v_existing.presentation_id <> p_presentation_id then
      raise exception using errcode = '23505', message = 'operation_id ya utilizado';
    end if;
    return jsonb_build_object(
      'lot_id', v_existing.lot_id,
      'opened_units', -v_existing.sealed_units_delta,
      'loose_quantity_added', v_existing.loose_quantity_delta,
      'idempotent_replay', true
    );
  end if;

  select * into v_lot
  from public.inventory_lots
  where store_id = p_store_id and id = p_lot_id
  for update;
  if not found or v_lot.status <> 'available' then
    raise exception using errcode = 'P0001', message = 'Lote no disponible';
  end if;

  select * into v_package
  from public.inventory_lot_packages
  where store_id = p_store_id and lot_id = p_lot_id
    and presentation_id = p_presentation_id
  for update;
  if not found or v_package.sealed_on_hand_units < p_units then
    raise exception using errcode = 'P0001', message = 'Paquetes sellados insuficientes';
  end if;

  select * into v_presentation
  from public.product_presentations
  where store_id = p_store_id and id = p_presentation_id
    and product_id = v_lot.product_id
  for share;
  if not found or not v_presentation.is_sealed then
    raise exception using errcode = '22023', message = 'La presentación no es un paquete sellado';
  end if;

  v_base_quantity := p_units * v_presentation.base_quantity;
  update public.inventory_lot_packages
  set sealed_on_hand_units = sealed_on_hand_units - p_units,
      updated_at = statement_timestamp()
  where store_id = p_store_id and lot_id = p_lot_id
    and presentation_id = p_presentation_id;

  update public.inventory_lots
  set loose_on_hand_quantity = loose_on_hand_quantity + v_base_quantity,
      updated_at = statement_timestamp()
  where store_id = p_store_id and id = p_lot_id;

  insert into public.inventory_movements (
    store_id, product_id, lot_id, presentation_id, movement_type,
    base_quantity_delta, loose_quantity_delta, sealed_units_delta,
    reason, reference_type, reference_id, operation_id, actor_user_id
  ) values (
    p_store_id, v_lot.product_id, p_lot_id, p_presentation_id, 'open_package',
    0, v_base_quantity, -p_units,
    p_reason, 'inventory_lot_package', v_package.id, p_operation_id, v_actor
  );

  return jsonb_build_object(
    'lot_id', p_lot_id,
    'opened_units', p_units,
    'loose_quantity_added', v_base_quantity,
    'idempotent_replay', false
  );
end;
$$;

create or replace function private.release_reservation_internal(
  p_reservation_id uuid,
  p_target_status text,
  p_now timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.inventory_reservations%rowtype;
begin
  if p_target_status not in ('released', 'expired') then
    raise exception using errcode = '22023', message = 'Estado de liberación inválido';
  end if;
  select * into v_reservation
  from public.inventory_reservations
  where id = p_reservation_id
  for update;
  if not found then
    return false;
  end if;
  if v_reservation.status in ('released', 'expired') then
    return false;
  end if;
  if v_reservation.status = 'consumed' then
    raise exception using errcode = 'P0001', message = 'No se puede liberar una reserva consumida';
  end if;

  update public.inventory_reservations
  set status = p_target_status,
      released_at = p_now,
      updated_at = p_now
  where id = p_reservation_id;
  return true;
end;
$$;

create or replace function private.release_expired_reservations(
  p_limit integer default 100
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_released integer := 0;
  v_cancelled_orders integer := 0;
  v_now timestamptz := statement_timestamp();
begin
  if p_limit < 1 or p_limit > 1000 then
    raise exception using errcode = '22023', message = 'Límite fuera de rango';
  end if;

  for v_row in
    select r.id, r.store_id, r.order_id
    from public.inventory_reservations r
    where r.status in ('reserved', 'partially_consumed')
      and r.expires_at <= v_now
    order by r.expires_at, r.id
    limit p_limit
    for update skip locked
  loop
    if private.release_reservation_internal(v_row.id, 'expired', v_now) then
      v_released := v_released + 1;
    end if;

    if not exists (
      select 1 from public.inventory_reservations r
      where r.store_id = v_row.store_id and r.order_id = v_row.order_id
        and r.status in ('reserved', 'partially_consumed')
    ) then
      update public.orders
      set status = 'cancelled', payment_status = 'expired',
          cancellation_reason_code = 'payment_expired',
          cancelled_at = v_now, updated_at = v_now
      where store_id = v_row.store_id and id = v_row.order_id
        and status = 'pending_payment';
      if found then
        v_cancelled_orders := v_cancelled_orders + 1;
        insert into public.order_status_history (
          store_id, order_id, from_status, to_status, reason_code,
          operation_id, created_at
        ) values (
          v_row.store_id, v_row.order_id, 'pending_payment', 'cancelled',
          'payment_expired', gen_random_uuid(), v_now
        );
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'released_reservations', v_released,
    'cancelled_orders', v_cancelled_orders
  );
end;
$$;

create or replace function private.transition_order(
  p_store_id uuid,
  p_order_id uuid,
  p_to_status text,
  p_operation_id uuid,
  p_reason_code text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
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

  if p_to_status = 'cancelled' then
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
$$;

create or replace function public.open_inventory_package(
  p_store_id uuid, p_lot_id uuid, p_presentation_id uuid,
  p_units bigint, p_operation_id uuid, p_reason text default null
)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.open_inventory_package($1,$2,$3,$4,$5,$6); $$;

create or replace function public.transition_order(
  p_store_id uuid, p_order_id uuid, p_to_status text, p_operation_id uuid,
  p_reason_code text default null, p_note text default null
)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.transition_order($1,$2,$3,$4,$5,$6); $$;

revoke all on function private.open_inventory_package(uuid,uuid,uuid,bigint,uuid,text) from public, anon;
revoke all on function private.release_reservation_internal(uuid,text,timestamptz) from public, anon, authenticated, service_role;
revoke all on function private.release_expired_reservations(integer) from public, anon, authenticated;
revoke all on function private.transition_order(uuid,uuid,text,uuid,text,text) from public, anon;
revoke all on function public.open_inventory_package(uuid,uuid,uuid,bigint,uuid,text) from public, anon;
revoke all on function public.transition_order(uuid,uuid,text,uuid,text,text) from public, anon;

grant execute on function private.open_inventory_package(uuid,uuid,uuid,bigint,uuid,text) to authenticated, service_role;
grant execute on function private.release_expired_reservations(integer) to service_role;
grant execute on function private.transition_order(uuid,uuid,text,uuid,text,text) to authenticated, service_role;
grant execute on function public.open_inventory_package(uuid,uuid,uuid,bigint,uuid,text) to authenticated;
grant execute on function public.transition_order(uuid,uuid,text,uuid,text,text) to authenticated;
