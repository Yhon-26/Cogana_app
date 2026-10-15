-- Validaciones comunes: sin permisos públicos ni acceso directo a códigos.
create table private.customer_fulfillment_codes (
  store_id uuid not null, order_id uuid primary key references public.orders(id) on delete cascade,
  assignment_id uuid references public.delivery_assignments(id) on delete cascade,
  code text not null, created_at timestamptz not null default statement_timestamp()
);
alter table private.customer_fulfillment_codes enable row level security;
revoke all on private.customer_fulfillment_codes from public,anon,authenticated;

create or replace function private.guard_commerce_operation(p_store_id uuid,p_operation_id uuid,p_kind text,p_target uuid)
returns void language plpgsql security definer set search_path='' as $$
declare entry private.operation_log%rowtype;
begin
  if p_operation_id is null then raise exception using errcode='22023',message='operation_id es obligatorio'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  select * into entry from private.operation_log where operation_id=p_operation_id;
  if found and (entry.store_id<>p_store_id or entry.operation_kind<>p_kind
    or entry.actor_user_id is distinct from auth.uid()
    or (case when p_kind='complete_delivery' then (entry.result->>'assignment_id')::uuid when p_kind='settle_manual_difference' then (entry.result->>'transaction_id')::uuid when p_kind='decide_substitution' then (entry.result->>'substitution_id')::uuid else (entry.result->>'order_id')::uuid end) is distinct from p_target) then
    raise exception using errcode='23505',message='Operación utilizada para otra solicitud';
  end if;
end; $$;
revoke all on function private.guard_commerce_operation(uuid,uuid,text,uuid) from public,anon,authenticated;

create or replace function private.assert_order_prepared(p_store_id uuid,p_order_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.orders where store_id=p_store_id and id=p_order_id and final_total_cents is not null)
    or not exists(select 1 from public.order_items where store_id=p_store_id and order_id=p_order_id)
    or exists(select 1 from public.order_items where store_id=p_store_id and order_id=p_order_id and (prepared_quantity is null or final_line_cents is null))
    or exists(select 1 from public.order_substitutions where store_id=p_store_id and order_id=p_order_id and status='pending')
    or exists(select 1 from public.payment_transactions where store_id=p_store_id and order_id=p_order_id
      and transaction_type in ('refund','adjustment') and status in ('pending','requires_action','processing')) then
    raise exception using errcode='P0001',message='Finaliza los artículos, sustituciones y diferencias de pago antes de entregar';
  end if;
end; $$;
revoke all on function private.assert_order_prepared(uuid,uuid) from public,anon,authenticated;


-- Entrada de inventario: registro de lote nuevo con existencias iniciales
-- (granel suelto y/o paquetes sellados) e idempotencia por operation_id.

create or replace function private.receive_inventory_lot(
  p_store_id uuid,
  p_product_id uuid,
  p_lot_code text,
  p_expires_on date default null,
  p_supplier_id uuid default null,
  p_loose_quantity bigint default 0,
  p_sealed jsonb default null,
  p_notes text default null,
  p_operation_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_product public.products%rowtype;
  v_lot_id uuid;
  v_loose bigint := coalesce(p_loose_quantity, 0);
  v_sealed_total bigint := 0;
  v_sealed_row record;
  v_existing private.operation_log%rowtype;
  v_fingerprint text;
  v_base_total bigint := v_loose;
begin
  if v_actor is null or not private.has_store_role(p_store_id, array['owner','admin']) then
    raise exception using errcode = '42501', message = 'No autorizado para registrar entradas de inventario';
  end if;
  if p_operation_id is null then
    raise exception using errcode = '22023', message = 'operation_id es obligatorio';
  end if;
  if p_lot_code is null or btrim(p_lot_code) = '' then
    raise exception using errcode = '22023', message = 'El código de lote es obligatorio';
  end if;
  if v_loose < 0 then
    raise exception using errcode = '22023', message = 'La cantidad suelta no puede ser negativa';
  end if;

  if p_sealed is not null and jsonb_typeof(p_sealed)<>'array' then
    raise exception using errcode='22023',message='Los paquetes deben ser una lista';
  end if;
  if exists(select 1 from jsonb_to_recordset(coalesce(p_sealed,'[]'::jsonb)) as x(presentation_id uuid,units bigint)
    where presentation_id is null or units is null or units<=0)
    or (select count(*)<>count(distinct presentation_id) from jsonb_to_recordset(coalesce(p_sealed,'[]'::jsonb)) as x(presentation_id uuid,units bigint)) then
    raise exception using errcode='22023',message='Presentaciones duplicadas o cantidades inválidas';
  end if;
  v_fingerprint:=encode(extensions.digest(jsonb_build_object('product',p_product_id,'lot',btrim(p_lot_code),
    'expires',p_expires_on,'supplier',p_supplier_id,'loose',v_loose,'sealed',coalesce(p_sealed,'[]'::jsonb),'notes',p_notes)::text,'sha256'),'hex');
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  select * into v_existing from private.operation_log where operation_id=p_operation_id;
  if found then
    if v_existing.store_id<>p_store_id or v_existing.operation_kind<>'receive_inventory_lot'
      or v_existing.actor_user_id is distinct from v_actor or v_existing.result->>'fingerprint'<>v_fingerprint then
      raise exception using errcode='23505',message='operation_id ya utilizado';
    end if;
    return (v_existing.result-'fingerprint')||jsonb_build_object('idempotent_replay',true);
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_store_id::text||p_product_id::text||btrim(p_lot_code),1));
  select * into v_product
  from public.products
  where store_id = p_store_id and id = p_product_id
  for share;
  if not found or not v_product.is_active then
    raise exception using errcode = 'P0001', message = 'Producto no disponible en esta tienda';
  end if;

  if (v_product.tracks_expiration and p_expires_on is null) or p_expires_on<(statement_timestamp() at time zone 'America/Lima')::date then
    raise exception using errcode='22023',message='Indica un vencimiento vigente para este producto';
  end if;
  if p_supplier_id is not null and not exists (
    select 1 from public.suppliers
    where store_id = p_store_id and id = p_supplier_id and is_active
  ) then
    raise exception using errcode = 'P0001', message = 'Proveedor no disponible en esta tienda';
  end if;

  -- El código de lote es nuevo por producto: reabastecer usa un lote distinto.
  if exists (
    select 1 from public.inventory_lots
    where store_id = p_store_id and product_id = p_product_id
      and lot_code = btrim(p_lot_code)
  ) then
    raise exception using errcode = '23505', message = 'Ya existe un lote con ese código para este producto';
  end if;

  -- Validar paquetes sellados y totales antes de crear el lote.
  if p_sealed is not null then
    for v_sealed_row in
      select entry.presentation_id, entry.units
      from jsonb_to_recordset(p_sealed)
        as entry(presentation_id uuid, units bigint)
      where entry.units is not null and entry.units > 0
    loop
      if not exists (
        select 1 from public.product_presentations
        where store_id = p_store_id
          and id = v_sealed_row.presentation_id
          and product_id = p_product_id
          and is_sealed
          and is_active
      ) then
        raise exception using errcode = 'P0001', message = 'Presentación sellada no válida para este producto';
      end if;
      v_sealed_total := v_sealed_total + v_sealed_row.units;
      select v_base_total + v_sealed_row.units*base_quantity into v_base_total
        from public.product_presentations where store_id=p_store_id and id=v_sealed_row.presentation_id;
    end loop;
  end if;

  if v_loose = 0 and v_sealed_total = 0 then
    raise exception using errcode = '22023',
      message = 'Registra al menos existencias sueltas o paquetes sellados';
  end if;

  insert into public.inventory_lots (
    store_id, product_id, supplier_id, lot_code, expires_on,
    loose_on_hand_quantity, status, notes, created_by
  ) values (
    p_store_id, p_product_id, p_supplier_id, btrim(p_lot_code), p_expires_on,
    v_loose, 'available', p_notes, v_actor
  )
  returning id into v_lot_id;

  if p_sealed is not null then
    for v_sealed_row in
      select entry.presentation_id, entry.units
      from jsonb_to_recordset(p_sealed)
        as entry(presentation_id uuid, units bigint)
      where entry.units is not null and entry.units > 0
    loop
      insert into public.inventory_lot_packages (
        store_id, lot_id, presentation_id, sealed_on_hand_units
      )
      select p_store_id, v_lot_id, v_sealed_row.presentation_id, v_sealed_row.units
      from public.product_presentations
      where store_id = p_store_id
        and id = v_sealed_row.presentation_id
        and product_id = p_product_id
        and is_sealed
        and is_active;
      if not found then
        raise exception using errcode = 'P0001', message = 'Presentación sellada no válida para este producto';
      end if;
    end loop;
  end if;

  insert into public.inventory_movements (
    store_id, product_id, lot_id, movement_type,
    base_quantity_delta, loose_quantity_delta, sealed_units_delta,
    reason, operation_id, actor_user_id
  ) values (
    p_store_id, p_product_id, v_lot_id, 'receipt',
    v_base_total, v_loose, v_sealed_total,
    p_notes, p_operation_id, v_actor
  );

  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result)
  values(p_operation_id,p_store_id,'receive_inventory_lot',v_actor,jsonb_build_object('lot_id',v_lot_id,
    'loose_quantity_added',v_loose,'sealed_units_added',v_sealed_total,'fingerprint',v_fingerprint));
  return jsonb_build_object(
    'lot_id', v_lot_id,
    'loose_quantity_added', v_loose,
    'sealed_units_added', v_sealed_total,
    'idempotent_replay', false
  );
end;
$$;

create or replace function public.receive_inventory_lot(
  p_store_id uuid, p_product_id uuid, p_lot_code text,
  p_expires_on date default null, p_supplier_id uuid default null,
  p_loose_quantity bigint default 0, p_sealed jsonb default null,
  p_notes text default null, p_operation_id uuid default null
)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.receive_inventory_lot($1,$2,$3,$4,$5,$6,$7,$8,$9); $$;

revoke all on function private.receive_inventory_lot(uuid,uuid,text,date,uuid,bigint,jsonb,text,uuid)
  from public, anon;
revoke all on function public.receive_inventory_lot(uuid,uuid,text,date,uuid,bigint,jsonb,text,uuid)
  from public, anon;

grant execute on function private.receive_inventory_lot(uuid,uuid,text,date,uuid,bigint,jsonb,text,uuid)
  to authenticated, service_role;
grant execute on function public.receive_inventory_lot(uuid,uuid,text,date,uuid,bigint,jsonb,text,uuid)
  to authenticated;


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
    if nullif(btrim(p_reason_code),'') is null then raise exception using errcode='22023',message='Indica el motivo de cancelación'; end if;
    update public.payment_transactions set status='cancelled',updated_at=statement_timestamp()
      where store_id=p_store_id and order_id=p_order_id and transaction_type in ('charge','adjustment')
        and status in ('pending','requires_action','processing');
    perform private.create_payment_operation(p_store_id,p_order_id,null,'refund',v_order.payment_method,'pending_refund',
      'cancel:'||p_order_id::text,net.amount,'pending') from (
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
  if v_charged > 0 and v_refunded >= v_charged then
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

CREATE OR REPLACE FUNCTION private.finalize_weighted_order(p_store_id uuid, p_order_id uuid, p_items jsonb, p_operation_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  perform private.guard_commerce_operation(p_store_id,p_operation_id,'finalize_weighted_order',p_order_id);
  select result into v_result from private.operation_log
  where operation_id=p_operation_id and store_id=p_store_id and operation_kind='finalize_weighted_order';
  if found then return v_result||jsonb_build_object('idempotent_replay',true); end if;
  if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then
    raise exception using errcode='22023', message='Debe indicar cantidades preparadas';
  end if;

  select * into v_order from public.orders
  where store_id=p_store_id and id=p_order_id for update;
  if not found or v_order.status not in ('preparing','awaiting_adjustment') then
    raise exception using errcode='P0001', message='El pedido no está en preparación';
  end if;
  if v_order.final_total_cents is not null then raise exception using errcode='P0001',message='La preparación ya fue finalizada'; end if;
  if v_order.payment_status<>'paid' and not (v_order.fulfillment_type='pickup' and v_order.payment_method='cash') then
    raise exception using errcode='P0001',message='El pago debe estar verificado'; end if;
  if exists(select 1 from public.order_substitutions where store_id=p_store_id and order_id=p_order_id and status='pending') then
    raise exception using errcode='P0001',message='Resuelve las sustituciones antes de finalizar'; end if;
  if (select count(*)<>count(distinct order_item_id) from jsonb_to_recordset(p_items) as x(order_item_id uuid,prepared_quantity bigint)) then
    raise exception using errcode='22023',message='No repitas artículos'; end if;
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

  perform private.refresh_order_payment_status(p_store_id,p_order_id);
  v_result:=jsonb_build_object('order_id',p_order_id,'final_total_cents',v_final_total,
    'paid_net_cents',v_paid_net,'difference_cents',v_adjustment,
    'status',case when v_adjustment>0 and v_paid_net>0 then 'awaiting_adjustment' else 'preparing' end,
    'idempotent_replay',false);
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result)
  values(p_operation_id,p_store_id,'finalize_weighted_order',v_actor,v_result);
  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION private.assign_delivery(p_store_id uuid, p_order_id uuid, p_driver_user_id uuid, p_operation_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor uuid:=(select auth.uid());
  v_assignment_id uuid:=gen_random_uuid();
  v_code text:=upper(encode(extensions.gen_random_bytes(4),'hex'));
  v_result jsonb;
begin
  if v_actor is null or not private.has_store_role(p_store_id,array['owner','admin']) then
    raise exception using errcode='42501',message='No autorizado para asignar entregas';
  end if;
  perform private.guard_commerce_operation(p_store_id,p_operation_id,'assign_delivery',p_order_id);
  select result into v_result from private.operation_log
  where operation_id=p_operation_id and store_id=p_store_id and operation_kind='assign_delivery';
  if found then return v_result||jsonb_build_object('confirmation_code',null,'idempotent_replay',true); end if;
  if not exists(select 1 from public.orders where store_id=p_store_id and id=p_order_id
    and fulfillment_type='delivery' and status='ready_for_delivery' for update) then
    raise exception using errcode='P0001',message='Pedido no listo para delivery';
  end if;
  perform private.assert_order_prepared(p_store_id,p_order_id);
  if p_driver_user_id is null then raise exception using errcode='22023',message='Selecciona un repartidor'; end if;
  if p_driver_user_id is not null and not exists(
    select 1 from public.store_memberships where store_id=p_store_id and user_id=p_driver_user_id
      and role in ('owner','admin','driver') and is_active
  ) then raise exception using errcode='P0001',message='Repartidor no autorizado'; end if;
  insert into public.delivery_assignments(
    id,store_id,order_id,driver_user_id,status,confirmation_code_hash
  ) values (
    v_assignment_id,p_store_id,p_order_id,p_driver_user_id,'assigned',
    extensions.crypt(v_code,extensions.gen_salt('bf'))
  );
  insert into private.customer_fulfillment_codes(store_id,order_id,assignment_id,code)
    values(p_store_id,p_order_id,v_assignment_id,v_code)
    on conflict(order_id) do update set assignment_id=excluded.assignment_id,code=excluded.code;
  insert into public.delivery_events(store_id,assignment_id,event_type,actor_user_id)
  values(p_store_id,v_assignment_id,'assigned',v_actor);
  v_result:=jsonb_build_object('assignment_id',v_assignment_id,'order_id',p_order_id,'idempotent_replay',false);
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result)
  values(p_operation_id,p_store_id,'assign_delivery',v_actor,v_result);
  return v_result||jsonb_build_object('confirmation_code',null);
end;
$function$;

CREATE OR REPLACE FUNCTION private.complete_pickup(p_store_id uuid, p_order_id uuid, p_confirmation_code text, p_operation_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor uuid:=(select auth.uid());
  v_order public.orders%rowtype;
  v_tx public.payment_transactions%rowtype;
  v_result jsonb;
begin
  if v_actor is null or not private.has_store_role(p_store_id,array['owner','admin']) then
    raise exception using errcode='42501',message='No autorizado para completar recojo';
  end if;
  perform private.guard_commerce_operation(p_store_id,p_operation_id,'complete_pickup',p_order_id);
  select result into v_result from private.operation_log
  where operation_id=p_operation_id and store_id=p_store_id and operation_kind='complete_pickup';
  if found then return v_result||jsonb_build_object('idempotent_replay',true); end if;
  select * into v_order from public.orders where store_id=p_store_id and id=p_order_id for update;
  if not found or v_order.fulfillment_type<>'pickup' or v_order.status<>'ready_for_pickup' then
    raise exception using errcode='P0001',message='Pedido no listo para recojo';
  end if;
  perform private.assert_order_prepared(p_store_id,p_order_id);
  if v_order.pickup_confirmation_code_hash is null or p_confirmation_code is null
     or extensions.crypt(p_confirmation_code,v_order.pickup_confirmation_code_hash)<>v_order.pickup_confirmation_code_hash then
    raise exception using errcode='42501',message='Código de recojo inválido';
  end if;
  if v_order.payment_method='cash' then
    select * into v_tx from public.payment_transactions
    where store_id=p_store_id and order_id=p_order_id and transaction_type='charge'
    order by created_at limit 1 for update;
    update public.payment_transactions set amount_cents=coalesce(v_order.final_total_cents,v_order.estimated_total_cents),
      status='succeeded',processed_at=statement_timestamp(),updated_at=statement_timestamp()
    where id=v_tx.id;
    perform private.refresh_order_payment_status(p_store_id,p_order_id);
  elsif v_order.payment_status<>'paid' then
    raise exception using errcode='P0001',message='El pedido todavía no está pagado';
  end if;
  update public.orders set status='completed',completed_at=statement_timestamp(),updated_at=statement_timestamp()
  where store_id=p_store_id and id=p_order_id;
  insert into public.order_status_history(store_id,order_id,from_status,to_status,reason_code,actor_user_id,operation_id)
  values(p_store_id,p_order_id,'ready_for_pickup','completed','pickup_code_verified',v_actor,p_operation_id);
  v_result:=jsonb_build_object('order_id',p_order_id,'status','completed','idempotent_replay',false);
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result)
  values(p_operation_id,p_store_id,'complete_pickup',v_actor,v_result);
  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION private.complete_delivery(p_store_id uuid, p_assignment_id uuid, p_confirmation_code text, p_evidence_storage_path text, p_recipient_name text, p_operation_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor uuid:=(select auth.uid());
  v_assignment public.delivery_assignments%rowtype;
  v_order public.orders%rowtype;
  v_result jsonb;
begin
  if v_actor is null then raise exception using errcode='42501',message='Se requiere autenticación'; end if;
  perform private.guard_commerce_operation(p_store_id,p_operation_id,'complete_delivery',p_assignment_id);
  select result into v_result from private.operation_log
  where operation_id=p_operation_id and store_id=p_store_id and operation_kind='complete_delivery';
  if found then return v_result||jsonb_build_object('idempotent_replay',true); end if;
  if not private.has_store_role(p_store_id,array['owner','admin','driver']) then raise exception using errcode='42501',message='Se requiere una cuenta activa de reparto'; end if;
  select * into v_assignment from public.delivery_assignments
  where store_id=p_store_id and id=p_assignment_id for update;
  if not found or v_assignment.status in ('delivered','failed','cancelled') then
    raise exception using errcode='P0001',message='Asignación no disponible';
  end if;
  if v_assignment.driver_user_id is distinct from v_actor
     and not private.has_store_role(p_store_id,array['owner','admin']) then
    raise exception using errcode='42501',message='No autorizado para completar esta entrega';
  end if;
  select * into v_order from public.orders
  where store_id=p_store_id and id=v_assignment.order_id for update;
  if v_order.status not in ('ready_for_delivery','out_for_delivery') or v_order.payment_status<>'paid' then
    raise exception using errcode='P0001',message='Pedido no pagado o no listo para entrega';
  end if;
  perform private.assert_order_prepared(p_store_id,v_order.id);
  if nullif(p_confirmation_code,'') is null then
    raise exception using errcode='22023',message='Se requiere el código del cliente para completar la entrega';
  end if;
  if nullif(p_confirmation_code,'') is not null and (
    v_assignment.confirmation_code_hash is null
    or extensions.crypt(p_confirmation_code,v_assignment.confirmation_code_hash)<>v_assignment.confirmation_code_hash
  ) then raise exception using errcode='42501',message='Código de entrega inválido'; end if;
  update public.delivery_assignments set status='delivered',recipient_name=nullif(p_recipient_name,''),
    evidence_storage_path=nullif(p_evidence_storage_path,''),delivered_at=statement_timestamp(),
    updated_at=statement_timestamp() where id=p_assignment_id;
  insert into public.delivery_events(store_id,assignment_id,event_type,note,actor_user_id)
  values(p_store_id,p_assignment_id,'delivered',
    case when nullif(p_evidence_storage_path,'') is not null then 'evidence_recorded' else 'code_verified' end,v_actor);
  update public.orders set status='completed',completed_at=statement_timestamp(),updated_at=statement_timestamp()
  where store_id=p_store_id and id=v_order.id;
  insert into public.order_status_history(store_id,order_id,from_status,to_status,reason_code,actor_user_id,operation_id)
  values(p_store_id,v_order.id,v_order.status,'completed','delivery_completed',v_actor,p_operation_id);
  v_result:=jsonb_build_object('order_id',v_order.id,'assignment_id',p_assignment_id,'status','completed','idempotent_replay',false);
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result)
  values(p_operation_id,p_store_id,'complete_delivery',v_actor,v_result);
  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION private.propose_substitution(p_store_id uuid, p_order_id uuid, p_order_item_id uuid, p_replacement_presentation_id uuid, p_proposed_quantity bigint, p_expires_at timestamp with time zone, p_operation_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor uuid:=(select auth.uid());
  v_item public.order_items%rowtype;
  v_order public.orders%rowtype;
  v_presentation public.product_presentations%rowtype;
  v_product public.products%rowtype;
  v_line bigint;
  v_current_line bigint;
  v_difference bigint;
  v_sub_id uuid:=gen_random_uuid();
  v_status text:='pending';
  v_result jsonb;
begin
  if v_actor is null or not private.has_store_role(p_store_id,array['owner','admin']) then
    raise exception using errcode='42501',message='No autorizado para proponer sustituciones';
  end if;
  perform private.guard_commerce_operation(p_store_id,p_operation_id,'propose_substitution',p_order_id);
  select result into v_result from private.operation_log
  where operation_id=p_operation_id and store_id=p_store_id and operation_kind='propose_substitution';
  if found then return v_result||jsonb_build_object('idempotent_replay',true); end if;
  if p_proposed_quantity is null or p_proposed_quantity<=0 then raise exception using errcode='22023',message='Cantidad propuesta inválida'; end if;

  select * into v_order from public.orders
  where store_id=p_store_id and id=p_order_id for update;
  if not found or v_order.status not in ('confirmed','preparing','awaiting_adjustment') then
    raise exception using errcode='P0001',message='El pedido no admite sustituciones';
  end if;
  if v_order.final_total_cents is not null then raise exception using errcode='P0001',message='La preparación ya fue finalizada'; end if;
  if p_expires_at is not null and p_expires_at<=statement_timestamp() then raise exception using errcode='22023',message='El plazo de respuesta debe ser futuro'; end if;
  if exists(select 1 from public.order_substitutions where store_id=p_store_id and order_item_id=p_order_item_id and status='pending') then raise exception using errcode='P0001',message='Ya existe una propuesta pendiente'; end if;
  select * into v_item from public.order_items
  where store_id=p_store_id and order_id=p_order_id and id=p_order_item_id for update;
  if not found then raise exception using errcode='P0001',message='Ítem no encontrado'; end if;
  select * into v_presentation from public.product_presentations
  where store_id=p_store_id and id=p_replacement_presentation_id and is_active for share;
  select * into v_product from public.products
  where store_id=p_store_id and id=v_presentation.product_id and is_active for share;
  if v_presentation.id is null or v_product.id is null then
    raise exception using errcode='P0001',message='Reemplazo no disponible';
  end if;
  if v_presentation.price_mode='fixed' then
    if p_proposed_quantity%v_presentation.base_quantity<>0 then
      raise exception using errcode='22023',message='Cantidad propuesta incompatible con presentación fija';
    end if;
    v_line:=(p_proposed_quantity/v_presentation.base_quantity)*v_presentation.price_cents;
  else
    v_line:=(p_proposed_quantity*v_presentation.price_cents+v_presentation.base_quantity/2)
      /v_presentation.base_quantity;
  end if;
  v_current_line:=coalesce(v_item.final_line_cents,v_item.estimated_line_cents)
    -coalesce(v_item.final_discount_cents,v_item.estimated_discount_cents);
  v_difference:=v_line-v_current_line;
  if v_item.substitution_policy='remove' then
    raise exception using errcode='P0001',message='El cliente pidió retirar el producto si falta';
  end if;
  if v_item.substitution_policy='allow_similar' and v_difference<=v_item.max_substitution_extra_cents then
    v_status:='auto_accepted';
  end if;

  insert into public.order_substitutions(
    id,store_id,order_id,order_item_id,replacement_product_id,replacement_presentation_id,
    proposed_quantity,proposed_line_cents,price_difference_cents,status,expires_at,proposed_by,
    decided_at
  ) values (
    v_sub_id,p_store_id,p_order_id,p_order_item_id,v_product.id,v_presentation.id,
    p_proposed_quantity,v_line,v_difference,v_status,p_expires_at,v_actor,
    case when v_status='auto_accepted' then statement_timestamp() else null end
  );
  if v_status='auto_accepted' then
    perform private.apply_substitution_internal(v_sub_id,'auto_accepted',v_actor);
  end if;
  v_result:=jsonb_build_object('order_id',p_order_id,'substitution_id',v_sub_id,'status',v_status,
    'price_difference_cents',v_difference,'idempotent_replay',false);
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result)
  values(p_operation_id,p_store_id,'propose_substitution',v_actor,v_result);
  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION private.decide_substitution(p_store_id uuid, p_substitution_id uuid, p_decision text, p_operation_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor uuid:=(select auth.uid());
  v_sub public.order_substitutions%rowtype;
  v_order public.orders%rowtype;
  v_result jsonb;
  v_is_staff boolean;
begin
  if v_actor is null or p_decision not in ('accepted','rejected') then
    raise exception using errcode='22023',message='Decisión inválida';
  end if;
  perform private.guard_commerce_operation(p_store_id,p_operation_id,'decide_substitution',p_substitution_id);
  select result into v_result from private.operation_log
  where operation_id=p_operation_id and store_id=p_store_id and operation_kind='decide_substitution';
  if found then return v_result||jsonb_build_object('idempotent_replay',true); end if;
  perform 1 from public.orders where store_id=p_store_id and id=(select order_id from public.order_substitutions where store_id=p_store_id and id=p_substitution_id) for update;
  select * into v_sub from public.order_substitutions
  where store_id=p_store_id and id=p_substitution_id for update;
  if not found or v_sub.status<>'pending' then
    raise exception using errcode='P0001',message='Propuesta no pendiente';
  end if;
  if v_sub.expires_at is not null and v_sub.expires_at<=statement_timestamp() then
    update public.order_substitutions set status='expired',decided_at=statement_timestamp(),updated_at=statement_timestamp()
    where id=v_sub.id;
    raise exception using errcode='P0001',message='La propuesta venció';
  end if;
  select * into v_order from public.orders where store_id=p_store_id and id=v_sub.order_id for update;
  v_is_staff:=private.has_store_role(p_store_id,array['owner','admin']);
  if v_order.requester_user_id<>v_actor and not v_is_staff then
    raise exception using errcode='42501',message='No autorizado para decidir esta sustitución';
  end if;
  if v_order.status not in ('confirmed','preparing','awaiting_adjustment') or v_order.final_total_cents is not null then raise exception using errcode='P0001',message='El pedido ya no admite cambios'; end if;
  if p_decision='accepted' then
    perform private.apply_substitution_internal(v_sub.id,'accepted',v_actor);
  else
    update public.order_substitutions set status='rejected',decided_at=statement_timestamp(),updated_at=statement_timestamp()
    where id=v_sub.id;
  end if;
  v_result:=jsonb_build_object('substitution_id',v_sub.id,'status',p_decision,'idempotent_replay',false);
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result)
  values(p_operation_id,p_store_id,'decide_substitution',v_actor,v_result);
  return v_result;
end;
$function$;

create or replace function private.settle_manual_difference(p_store_id uuid,p_transaction_id uuid,p_reference text,p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); tx public.payment_transactions%rowtype; result jsonb; payment_state text;
begin
  if not private.has_store_role(p_store_id,array['owner','admin']) then raise exception using errcode='42501',message='No autorizado'; end if;
  if nullif(btrim(p_reference),'') is null or length(p_reference)>100 then raise exception using errcode='22023',message='Indica la referencia verificada'; end if;
  -- Order before transaction: same lock order as payment confirmation/finalization.
  perform 1 from public.orders where store_id=p_store_id and id=(select order_id from public.payment_transactions where store_id=p_store_id and id=p_transaction_id) for update;
  perform private.guard_commerce_operation(p_store_id,p_operation_id,'settle_manual_difference',p_transaction_id);
  select l.result into result from private.operation_log l where operation_id=p_operation_id;
  if found then return result||jsonb_build_object('idempotent_replay',true); end if;
  select * into tx from public.payment_transactions where store_id=p_store_id and id=p_transaction_id for update;
  if not found or tx.transaction_type not in ('refund','adjustment') or tx.provider not in ('pending_refund','pending_adjustment')
    or tx.status not in ('pending','requires_action','processing') then raise exception using errcode='P0001',message='Diferencia no pendiente'; end if;
  update public.payment_transactions set status='succeeded',provider_reference=btrim(p_reference),processed_at=statement_timestamp(),updated_at=statement_timestamp() where id=tx.id;
  insert into public.payment_events(provider,provider_event_id,event_type,payload,signature_valid,processed_at)
  values('manual_difference',p_operation_id::text,'manual_settlement',jsonb_build_object('store_id',p_store_id,'transaction_id',tx.id,'actor_id',actor),true,statement_timestamp());
  payment_state:=private.refresh_order_payment_status(p_store_id,tx.order_id);
  if payment_state='paid' and exists(select 1 from public.orders where id=tx.order_id and status='awaiting_adjustment') then
    update public.orders set status='preparing' where id=tx.order_id;
    insert into public.order_status_history(store_id,order_id,from_status,to_status,reason_code,actor_user_id,operation_id)
    values(p_store_id,tx.order_id,'awaiting_adjustment','preparing','difference_settled',actor,gen_random_uuid());
  end if;
  result:=jsonb_build_object('transaction_id',tx.id,'order_id',tx.order_id,'status','succeeded','idempotent_replay',false);
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result) values(p_operation_id,p_store_id,'settle_manual_difference',actor,result);
  return result;
end; $$;
create or replace function public.settle_manual_difference(p_store_id uuid,p_transaction_id uuid,p_reference text,p_operation_id uuid)
returns jsonb language sql security invoker set search_path='' as $$ select private.settle_manual_difference($1,$2,$3,$4); $$;
revoke all on function public.settle_manual_difference(uuid,uuid,text,uuid),private.settle_manual_difference(uuid,uuid,text,uuid) from public,anon;
grant execute on function public.settle_manual_difference(uuid,uuid,text,uuid),private.settle_manual_difference(uuid,uuid,text,uuid) to authenticated;

create or replace function private.get_customer_order_details(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); ord public.orders%rowtype; assignment public.delivery_assignments%rowtype; code_value text; result jsonb;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception using errcode='42501',message='Inicia sesión para consultar tu pedido'; end if;
  select * into ord from public.orders where id=p_order_id and requester_user_id=actor for update;
  if not found then raise exception using errcode='42501',message='Pedido no disponible para esta cuenta'; end if;
  if ord.status in ('ready_for_pickup','ready_for_delivery','out_for_delivery') and (ord.payment_status='paid' or (ord.fulfillment_type='pickup' and ord.payment_method='cash')) then
    select * into assignment from public.delivery_assignments where store_id=ord.store_id and order_id=ord.id and status in ('assigned','accepted','picked_up','delivering') order by created_at desc limit 1 for update;
    if ord.fulfillment_type='pickup' or assignment.id is not null then
      select code into code_value from private.customer_fulfillment_codes where order_id=ord.id;
      if code_value is null then
        code_value:=upper(encode(extensions.gen_random_bytes(4),'hex'));
        insert into private.customer_fulfillment_codes(store_id,order_id,assignment_id,code) values(ord.store_id,ord.id,assignment.id,code_value);
        if ord.fulfillment_type='pickup' then
          update public.orders set pickup_confirmation_code_hash=extensions.crypt(code_value,extensions.gen_salt('bf')) where id=ord.id;
        else
          update public.delivery_assignments set confirmation_code_hash=extensions.crypt(code_value,extensions.gen_salt('bf')) where id=assignment.id;
        end if;
      end if;
    end if;
  end if;
  result:=jsonb_build_object('order',jsonb_build_object('id',ord.id,'store_id',ord.store_id,'order_number',ord.order_number,
    'status',ord.status,'payment_status',ord.payment_status,'payment_method',ord.payment_method,'fulfillment_type',ord.fulfillment_type,
    'scheduled_for',ord.scheduled_for,'delivery_address',ord.delivery_address,'estimated_total_cents',ord.estimated_total_cents,'final_total_cents',ord.final_total_cents,
    'created_at',ord.created_at,'completed_at',ord.completed_at,'cancellation_reason_code',ord.cancellation_reason_code),
    'confirmation_code',code_value,
    'items',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'name',i.product_name_snapshot,'presentation',i.presentation_name_snapshot,'unit',i.base_unit_snapshot,
      'estimated_quantity',i.estimated_quantity,'prepared_quantity',i.prepared_quantity,'estimated_line_cents',i.estimated_line_cents,'final_line_cents',i.final_line_cents,
      'discount_cents',coalesce(i.final_discount_cents,i.estimated_discount_cents)) order by i.created_at,i.id) from public.order_items i where i.store_id=ord.store_id and i.order_id=ord.id),'[]'::jsonb),
    'history',coalesce((select jsonb_agg(jsonb_build_object('status',h.to_status,'at',h.created_at,'reason',h.reason_code) order by h.created_at,h.id) from public.order_status_history h where h.store_id=ord.store_id and h.order_id=ord.id),'[]'::jsonb),
    'substitutions',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'item_id',s.order_item_id,'name',p.name,'presentation',pp.name,'quantity',s.proposed_quantity,
      'difference_cents',s.price_difference_cents,'status',s.status,'expires_at',s.expires_at) order by s.created_at) from public.order_substitutions s
      join public.products p on p.id=s.replacement_product_id and p.store_id=s.store_id join public.product_presentations pp on pp.id=s.replacement_presentation_id and pp.store_id=s.store_id
      where s.store_id=ord.store_id and s.order_id=ord.id),'[]'::jsonb),
    'differences',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'type',t.transaction_type,'amount_cents',t.amount_cents,'status',t.status))
      from public.payment_transactions t where t.store_id=ord.store_id and t.order_id=ord.id and t.transaction_type in ('refund','adjustment')),'[]'::jsonb));
  return result;
end; $$;
create or replace function public.get_customer_order_details(p_order_id uuid)
returns jsonb language sql security invoker set search_path='' as $$ select private.get_customer_order_details($1); $$;
revoke all on function public.get_customer_order_details(uuid),private.get_customer_order_details(uuid) from public,anon;
grant execute on function public.get_customer_order_details(uuid),private.get_customer_order_details(uuid) to authenticated;

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
  update public.orders set status='cancelled',cancellation_reason_code='customer_cancelled',cancelled_at=statement_timestamp() where id=ord.id;
  insert into public.order_status_history(store_id,order_id,from_status,to_status,reason_code,actor_user_id,operation_id)
    values(ord.store_id,ord.id,ord.status,'cancelled','customer_cancelled',actor,p_operation_id);
  result:=jsonb_build_object('order_id',ord.id,'status','cancelled');
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result) values(p_operation_id,ord.store_id,'cancel_customer_order',actor,result);
  return result;
end; $$;
create or replace function public.cancel_customer_order(p_order_id uuid,p_operation_id uuid)
returns jsonb language sql security invoker set search_path='' as $$ select private.cancel_customer_order($1,$2); $$;
revoke all on function public.cancel_customer_order(uuid,uuid),private.cancel_customer_order(uuid,uuid) from public,anon;
grant execute on function public.cancel_customer_order(uuid,uuid),private.cancel_customer_order(uuid,uuid) to authenticated;

create or replace function private.save_customer_account(p_store_id uuid,p_payload jsonb,p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); customer public.customers%rowtype; result jsonb; fingerprint text; previous private.operation_log%rowtype;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception using errcode='42501',message='Inicia sesión para guardar tus datos'; end if;
  if not exists(select 1 from public.stores where id=p_store_id and status='active') then raise exception using errcode='22023',message='Tienda no disponible'; end if;
  if p_operation_id is null then raise exception using errcode='22023',message='Falta operation_id'; end if;
  fingerprint:=encode(extensions.digest(p_payload::text,'sha256'),'hex');
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  select * into previous from private.operation_log where operation_id=p_operation_id;
  if found then
    if previous.actor_user_id is distinct from actor or previous.store_id<>p_store_id or previous.operation_kind<>'save_customer_account' or previous.result->>'fingerprint'<>fingerprint then raise exception using errcode='23505',message='Operación ya utilizada'; end if;
    return previous.result-'fingerprint';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_store_id::text||actor::text,2));
  select * into customer from public.customers where store_id=p_store_id and auth_user_id=actor for update;
  if found and customer.status<>'active' then raise exception using errcode='42501',message='Esta cuenta no permite cambios. Contacta a la tienda'; end if;
  if p_payload ? 'name' then
    if length(btrim(p_payload->>'name')) not between 2 and 100 or coalesce(p_payload->>'phone','') !~ '^\+?519[0-9]{8}$|^9[0-9]{8}$' then
      raise exception using errcode='22023',message='Revisa tu nombre y celular peruano'; end if;
    insert into public.customers(store_id,auth_user_id,name,phone,email) values(p_store_id,actor,btrim(p_payload->>'name'),p_payload->>'phone',auth.jwt()->>'email')
      on conflict(store_id,auth_user_id) do update set name=excluded.name,phone=excluded.phone,updated_at=statement_timestamp() returning * into customer;
  end if;
  if customer.id is null then raise exception using errcode='P0001',message='Guarda primero tu nombre y celular en Preferencias'; end if;
  if p_payload ? 'address' then
    if nullif(btrim(p_payload->'address'->>'label'),'') is null or nullif(btrim(p_payload->'address'->>'address_line'),'') is null or nullif(btrim(p_payload->'address'->>'district'),'') is null then raise exception using errcode='22023',message='Completa etiqueta, dirección y distrito'; end if;
    if coalesce((p_payload->'address'->>'is_default')::boolean,false) then update public.customer_addresses set is_default=false where store_id=p_store_id and customer_id=customer.id and is_default; end if;
    insert into public.customer_addresses(store_id,customer_id,label,address_line,district,reference,is_default)
      values(p_store_id,customer.id,btrim(p_payload->'address'->>'label'),btrim(p_payload->'address'->>'address_line'),btrim(p_payload->'address'->>'district'),nullif(btrim(p_payload->'address'->>'reference'),''),coalesce((p_payload->'address'->>'is_default')::boolean,false));
  end if;
  if p_payload ? 'preferences' then
    insert into public.customer_preferences(store_id,customer_id,order_notifications,promotion_notifications,marketing_consent,substitution_default)
      values(p_store_id,customer.id,coalesce((p_payload->'preferences'->>'order_notifications')::boolean,true),coalesce((p_payload->'preferences'->>'promotion_notifications')::boolean,false),coalesce((p_payload->'preferences'->>'marketing_consent')::boolean,false),coalesce(p_payload->'preferences'->>'substitution_default','contact'))
      on conflict(store_id,customer_id) do update set order_notifications=excluded.order_notifications,promotion_notifications=excluded.promotion_notifications,marketing_consent=excluded.marketing_consent,substitution_default=excluded.substitution_default,updated_at=statement_timestamp();
  end if;
  result:=jsonb_build_object('customer_id',customer.id,'fingerprint',fingerprint);
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result) values(p_operation_id,p_store_id,'save_customer_account',actor,result);
  return result-'fingerprint';
end; $$;
create or replace function public.save_customer_account(p_store_id uuid,p_payload jsonb,p_operation_id uuid)
returns jsonb language sql security invoker set search_path='' as $$ select private.save_customer_account($1,$2,$3); $$;
revoke all on function public.save_customer_account(uuid,jsonb,uuid),private.save_customer_account(uuid,jsonb,uuid) from public,anon;
grant execute on function public.save_customer_account(uuid,jsonb,uuid),private.save_customer_account(uuid,jsonb,uuid) to authenticated;
