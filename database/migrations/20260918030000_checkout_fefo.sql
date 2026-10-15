-- Checkout transaccional y reserva FEFO para Cogana.
-- Las funciones privilegiadas viven en private; public solo contiene un wrapper
-- SECURITY INVOKER que conserva auth.uid() y es la superficie RPC autenticada.

alter table public.orders
  add column if not exists pickup_confirmation_code_hash text;

create or replace function private.reserve_inventory_fefo(
  p_store_id uuid,
  p_order_id uuid,
  p_order_item_id uuid,
  p_product_id uuid,
  p_presentation_id uuid,
  p_quantity bigint,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation_id uuid;
  v_existing public.inventory_reservations%rowtype;
  v_presentation public.product_presentations%rowtype;
  v_lot record;
  v_remaining bigint := p_quantity;
  v_reserved bigint;
  v_available bigint;
  v_take bigint;
  v_units_needed bigint;
  v_units_take bigint;
  v_local_date date;
begin
  if p_quantity <= 0 then
    raise exception using errcode = '22023', message = 'La cantidad a reservar debe ser positiva';
  end if;
  if p_expires_at <= statement_timestamp() then
    raise exception using errcode = '22023', message = 'La reserva debe vencer en el futuro';
  end if;

  select * into v_existing
  from public.inventory_reservations
  where store_id = p_store_id and order_item_id = p_order_item_id
  for update;

  if found then
    if v_existing.order_id <> p_order_id
       or v_existing.product_id <> p_product_id
       or v_existing.reserved_quantity <> p_quantity
       or v_existing.status not in ('reserved', 'partially_consumed') then
      raise exception using errcode = '23505', message = 'El ítem ya tiene una reserva incompatible';
    end if;
    return v_existing.id;
  end if;

  select pp.* into v_presentation
  from public.product_presentations pp
  join public.products p
    on p.store_id = pp.store_id and p.id = pp.product_id
  where pp.store_id = p_store_id
    and pp.id = p_presentation_id
    and pp.product_id = p_product_id
    and pp.is_active
    and p.is_active
  for share of pp, p;

  if not found then
    raise exception using errcode = 'P0001', message = 'Presentación no disponible';
  end if;

  select (statement_timestamp() at time zone s.timezone)::date
  into v_local_date
  from public.stores s
  where s.id = p_store_id and s.status = 'active';

  if v_local_date is null then
    raise exception using errcode = 'P0001', message = 'Tienda no disponible';
  end if;

  v_reservation_id := gen_random_uuid();
  insert into public.inventory_reservations (
    id, store_id, order_id, order_item_id, product_id,
    reserved_quantity, status, expires_at
  ) values (
    v_reservation_id, p_store_id, p_order_id, p_order_item_id, p_product_id,
    p_quantity, 'reserved', p_expires_at
  );

  if v_presentation.is_sealed then
    if p_quantity % v_presentation.base_quantity <> 0 then
      raise exception using errcode = '22023', message = 'La cantidad sellada no coincide con la presentación';
    end if;
    v_units_needed := p_quantity / v_presentation.base_quantity;

    for v_lot in
      select l.id as lot_id, lp.sealed_on_hand_units
      from public.inventory_lots l
      join public.inventory_lot_packages lp
        on lp.store_id = l.store_id and lp.lot_id = l.id
      where l.store_id = p_store_id
        and l.product_id = p_product_id
        and l.status = 'available'
        and (l.expires_on is null or l.expires_on >= v_local_date)
        and lp.presentation_id = p_presentation_id
        and lp.sealed_on_hand_units > 0
      order by l.expires_on asc nulls last, l.received_at, l.id
      for update of l, lp
    loop
      select coalesce(sum(a.allocated_package_units), 0)
      into v_reserved
      from public.inventory_reservation_allocations a
      join public.inventory_reservations r
        on r.store_id = a.store_id and r.id = a.reservation_id
      where a.store_id = p_store_id
        and a.lot_id = v_lot.lot_id
        and a.package_presentation_id = p_presentation_id
        and r.status in ('reserved', 'partially_consumed')
        and r.expires_at > statement_timestamp();

      v_available := greatest(v_lot.sealed_on_hand_units - v_reserved, 0);
      v_units_take := least(v_available, v_units_needed);
      if v_units_take > 0 then
        insert into public.inventory_reservation_allocations (
          store_id, reservation_id, lot_id, package_presentation_id,
          allocated_base_quantity, allocated_package_units
        ) values (
          p_store_id, v_reservation_id, v_lot.lot_id, p_presentation_id,
          v_units_take * v_presentation.base_quantity, v_units_take
        );
        v_units_needed := v_units_needed - v_units_take;
      end if;
      exit when v_units_needed = 0;
    end loop;

    if v_units_needed <> 0 then
      raise exception using errcode = 'P0001', message = 'Stock sellado insuficiente';
    end if;
  else
    for v_lot in
      select l.id as lot_id, l.loose_on_hand_quantity
      from public.inventory_lots l
      where l.store_id = p_store_id
        and l.product_id = p_product_id
        and l.status = 'available'
        and (l.expires_on is null or l.expires_on >= v_local_date)
        and l.loose_on_hand_quantity > 0
      order by l.expires_on asc nulls last, l.received_at, l.id
      for update of l
    loop
      select coalesce(sum(a.allocated_base_quantity), 0)
      into v_reserved
      from public.inventory_reservation_allocations a
      join public.inventory_reservations r
        on r.store_id = a.store_id and r.id = a.reservation_id
      where a.store_id = p_store_id
        and a.lot_id = v_lot.lot_id
        and a.package_presentation_id is null
        and r.status in ('reserved', 'partially_consumed')
        and r.expires_at > statement_timestamp();

      v_available := greatest(v_lot.loose_on_hand_quantity - v_reserved, 0);
      v_take := least(v_available, v_remaining);
      if v_take > 0 then
        insert into public.inventory_reservation_allocations (
          store_id, reservation_id, lot_id, package_presentation_id,
          allocated_base_quantity, allocated_package_units
        ) values (
          p_store_id, v_reservation_id, v_lot.lot_id, null, v_take, 0
        );
        v_remaining := v_remaining - v_take;
      end if;
      exit when v_remaining = 0;
    end loop;

    if v_remaining <> 0 then
      raise exception using errcode = 'P0001', message = 'Stock a granel insuficiente';
    end if;
  end if;

  return v_reservation_id;
end;
$$;

create or replace function private.create_checkout_order(
  p_payload jsonb,
  p_operation_id uuid,
  p_reservation_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_store_id uuid := nullif(p_payload->>'store_id', '')::uuid;
  v_customer_id uuid;
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_source text := coalesce(nullif(p_payload->>'source', ''), 'web');
  v_fulfillment text := p_payload->>'fulfillment_type';
  v_payment_method text := p_payload->>'payment_method';
  v_customer_name text := btrim(coalesce(p_payload#>>'{customer,name}', ''));
  v_customer_phone text := btrim(coalesce(p_payload#>>'{customer,phone}', ''));
  v_customer_email text := nullif(btrim(coalesce(p_payload#>>'{customer,email}', '')), '');
  v_delivery_zone_id uuid := nullif(p_payload->>'delivery_zone_id', '')::uuid;
  v_delivery_address jsonb := p_payload->'delivery_address';
  v_delivery_fee bigint := 0;
  v_subtotal bigint := 0;
  v_total bigint := 0;
  v_pickup_code text;
  v_existing public.orders%rowtype;
  v_settings public.store_settings%rowtype;
  v_item record;
  v_presentation public.product_presentations%rowtype;
  v_product public.products%rowtype;
  v_estimated_quantity bigint;
  v_line_cents bigint;
  v_item_id uuid;
  v_count integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Se requiere una sesión autenticada';
  end if;
  if p_operation_id is null then
    raise exception using errcode = '22023', message = 'operation_id es obligatorio';
  end if;
  if p_reservation_expires_at <= statement_timestamp() then
    raise exception using errcode = '22023', message = 'La reserva debe vencer en el futuro';
  end if;

  select * into v_existing
  from public.orders
  where store_id = v_store_id and operation_id = p_operation_id;
  if found then
    if v_existing.requester_user_id <> v_user_id then
      raise exception using errcode = '42501', message = 'La operación pertenece a otra identidad';
    end if;
    return jsonb_build_object(
      'order_id', v_existing.id,
      'order_number', v_existing.order_number,
      'status', v_existing.status,
      'payment_status', v_existing.payment_status,
      'estimated_total_cents', v_existing.estimated_total_cents,
      'idempotent_replay', true
    );
  end if;

  select ss.* into v_settings
  from public.store_settings ss
  join public.stores s on s.id = ss.store_id
  where ss.store_id = v_store_id and s.status = 'active'
  for share of ss, s;
  if not found then
    raise exception using errcode = 'P0001', message = 'Tienda no disponible';
  end if;

  if v_customer_name = '' or v_customer_phone = '' then
    raise exception using errcode = '22023', message = 'Nombre y teléfono son obligatorios';
  end if;
  if v_source not in ('web', 'android', 'phone', 'whatsapp') then
    raise exception using errcode = '22023', message = 'Origen de pedido inválido';
  end if;
  if v_fulfillment not in ('pickup', 'delivery') then
    raise exception using errcode = '22023', message = 'Tipo de entrega inválido';
  end if;
  if v_payment_method not in ('cash', 'yape', 'plin', 'card') then
    raise exception using errcode = '22023', message = 'Método de pago inválido';
  end if;
  if v_fulfillment = 'pickup' and not v_settings.accepts_pickup then
    raise exception using errcode = 'P0001', message = 'Recojo no disponible';
  end if;
  if v_fulfillment = 'delivery' and not v_settings.accepts_delivery then
    raise exception using errcode = 'P0001', message = 'Delivery no disponible';
  end if;
  if v_payment_method = 'cash' and (v_fulfillment <> 'pickup' or not v_settings.accepts_cash_pickup) then
    raise exception using errcode = 'P0001', message = 'El efectivo sólo está permitido para recojo';
  end if;
  if v_payment_method = 'yape' and not v_settings.accepts_yape then
    raise exception using errcode = 'P0001', message = 'Yape no disponible';
  end if;
  if v_payment_method = 'plin' and not v_settings.accepts_plin then
    raise exception using errcode = 'P0001', message = 'Plin no disponible';
  end if;
  if v_payment_method = 'card' and not v_settings.accepts_card then
    raise exception using errcode = 'P0001', message = 'Tarjeta no disponible';
  end if;

  if jsonb_typeof(p_payload->'items') <> 'array' or jsonb_array_length(p_payload->'items') = 0 then
    raise exception using errcode = '22023', message = 'El pedido debe contener artículos';
  end if;
  select count(*) into v_count
  from (
    select x.presentation_id
    from jsonb_to_recordset(p_payload->'items')
      as x(presentation_id uuid, request_mode text, requested_quantity bigint,
           requested_money_cents bigint, substitution_policy text,
           max_substitution_extra_cents bigint)
    group by x.presentation_id
    having count(*) > 1
  ) duplicates;
  if v_count > 0 then
    raise exception using errcode = '22023', message = 'No repitas una presentación en el mismo checkout';
  end if;

  insert into public.customers (store_id, auth_user_id, name, phone, email)
  values (v_store_id, v_user_id, v_customer_name, v_customer_phone, v_customer_email)
  on conflict (store_id, auth_user_id) do update
    set name = excluded.name,
        phone = excluded.phone,
        email = coalesce(excluded.email, public.customers.email),
        updated_at = statement_timestamp()
  returning id into v_customer_id;

  if v_fulfillment = 'delivery' then
    if v_delivery_zone_id is null or jsonb_typeof(v_delivery_address) <> 'object' then
      raise exception using errcode = '22023', message = 'Zona y dirección son obligatorias para delivery';
    end if;
    select dz.fee_cents into v_delivery_fee
    from public.delivery_zones dz
    where dz.store_id = v_store_id and dz.id = v_delivery_zone_id and dz.is_active
    for share;
    if not found then
      raise exception using errcode = 'P0001', message = 'Zona de reparto no disponible';
    end if;
  else
    v_delivery_zone_id := null;
    v_delivery_address := null;
  end if;

  -- Se bloquean y procesan presentaciones siempre en UUID ascendente.
  for v_item in
    select x.*
    from jsonb_to_recordset(p_payload->'items')
      as x(presentation_id uuid, request_mode text, requested_quantity bigint,
           requested_money_cents bigint, substitution_policy text,
           max_substitution_extra_cents bigint)
    order by x.presentation_id
  loop
    select pp.* into v_presentation
    from public.product_presentations pp
    join public.products p on p.store_id = pp.store_id and p.id = pp.product_id
    where pp.store_id = v_store_id and pp.id = v_item.presentation_id
      and pp.is_active and p.is_active
    for share of pp, p;
    if not found then
      raise exception using errcode = 'P0001', message = 'Una presentación no está disponible';
    end if;
    select p.* into v_product
    from public.products p
    where p.store_id = v_store_id and p.id = v_presentation.product_id;

    if v_item.request_mode = 'presentation' then
      if v_item.requested_quantity is null or v_item.requested_quantity <= 0 then
        raise exception using errcode = '22023', message = 'Cantidad de presentaciones inválida';
      end if;
      v_estimated_quantity := v_item.requested_quantity * v_presentation.base_quantity;
      v_line_cents := v_item.requested_quantity * v_presentation.price_cents;
    elsif v_item.request_mode = 'quantity' then
      if not v_presentation.allows_quantity_input
         or v_presentation.price_mode <> 'proportional'
         or v_item.requested_quantity is null
         or v_item.requested_quantity < v_presentation.minimum_quantity
         or v_item.requested_quantity % v_presentation.quantity_step <> 0 then
        raise exception using errcode = '22023', message = 'Cantidad libre inválida';
      end if;
      v_estimated_quantity := v_item.requested_quantity;
      v_line_cents := (v_estimated_quantity * v_presentation.price_cents
        + v_presentation.base_quantity / 2) / v_presentation.base_quantity;
    elsif v_item.request_mode = 'money' then
      if not v_presentation.allows_money_input
         or v_item.requested_money_cents is null
         or v_item.requested_money_cents <= 0 then
        raise exception using errcode = '22023', message = 'Importe libre inválido';
      end if;
      v_estimated_quantity := ((v_item.requested_money_cents * v_presentation.base_quantity
        / v_presentation.price_cents) / v_presentation.quantity_step)
        * v_presentation.quantity_step;
      if v_estimated_quantity < v_presentation.minimum_quantity then
        raise exception using errcode = '22023', message = 'El importe no alcanza la cantidad mínima';
      end if;
      v_line_cents := v_estimated_quantity * v_presentation.price_cents
        / v_presentation.base_quantity;
    else
      raise exception using errcode = '22023', message = 'Modo de solicitud inválido';
    end if;

    if v_line_cents <= 0 then
      raise exception using errcode = '22023', message = 'El total del artículo debe ser positivo';
    end if;
    v_subtotal := v_subtotal + v_line_cents;
  end loop;

  if v_fulfillment = 'delivery' and exists (
    select 1 from public.delivery_zones dz
    where dz.store_id = v_store_id and dz.id = v_delivery_zone_id
      and v_subtotal < dz.minimum_order_cents
  ) then
    raise exception using errcode = 'P0001', message = 'El pedido no alcanza el mínimo de la zona';
  end if;

  v_total := v_subtotal + v_delivery_fee;
  v_order_number := 'CG-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 12));
  if v_fulfillment = 'pickup' then
    v_pickup_code := upper(encode(extensions.gen_random_bytes(4), 'hex'));
  end if;

  insert into public.orders (
    id, store_id, order_number, operation_id, requester_user_id, customer_id,
    source, fulfillment_type, status, payment_status, payment_method,
    customer_name, customer_phone, customer_email, delivery_zone_id,
    delivery_address, scheduled_for, preparation_not_before,
    estimated_subtotal_cents, estimated_discount_cents, delivery_fee_cents,
    delivery_discount_cents, estimated_total_cents, notes,
    pickup_confirmation_code_hash
  ) values (
    v_order_id, v_store_id, v_order_number, p_operation_id, v_user_id, v_customer_id,
    v_source, v_fulfillment,
    case when v_payment_method = 'cash' then 'queued' else 'pending_payment' end,
    case when v_payment_method in ('yape', 'plin') then 'requires_action' else 'pending' end,
    v_payment_method, v_customer_name, v_customer_phone, v_customer_email,
    v_delivery_zone_id, v_delivery_address,
    nullif(p_payload->>'scheduled_for', '')::timestamptz,
    nullif(p_payload->>'preparation_not_before', '')::timestamptz,
    v_subtotal, 0, v_delivery_fee, 0, v_total,
    nullif(p_payload->>'notes', ''),
    case when v_pickup_code is null then null
         else extensions.crypt(v_pickup_code, extensions.gen_salt('bf')) end
  );

  for v_item in
    select x.*
    from jsonb_to_recordset(p_payload->'items')
      as x(presentation_id uuid, request_mode text, requested_quantity bigint,
           requested_money_cents bigint, substitution_policy text,
           max_substitution_extra_cents bigint)
    order by x.presentation_id
  loop
    select pp.* into v_presentation
    from public.product_presentations pp
    join public.products p on p.store_id = pp.store_id and p.id = pp.product_id
    where pp.store_id = v_store_id and pp.id = v_item.presentation_id;
    select p.* into v_product
    from public.products p
    where p.store_id = v_store_id and p.id = v_presentation.product_id;

    if v_item.request_mode = 'presentation' then
      v_estimated_quantity := v_item.requested_quantity * v_presentation.base_quantity;
      v_line_cents := v_item.requested_quantity * v_presentation.price_cents;
    elsif v_item.request_mode = 'quantity' then
      v_estimated_quantity := v_item.requested_quantity;
      v_line_cents := (v_estimated_quantity * v_presentation.price_cents
        + v_presentation.base_quantity / 2) / v_presentation.base_quantity;
    else
      v_estimated_quantity := ((v_item.requested_money_cents * v_presentation.base_quantity
        / v_presentation.price_cents) / v_presentation.quantity_step)
        * v_presentation.quantity_step;
      v_line_cents := v_estimated_quantity * v_presentation.price_cents
        / v_presentation.base_quantity;
    end if;

    v_item_id := gen_random_uuid();
    insert into public.order_items (
      id, store_id, order_id, product_id, presentation_id,
      product_name_snapshot, presentation_name_snapshot, base_unit_snapshot,
      request_mode, requested_quantity, requested_money_cents,
      estimated_quantity, price_cents_snapshot, pricing_quantity_snapshot,
      estimated_line_cents, substitution_policy, max_substitution_extra_cents
    ) values (
      v_item_id, v_store_id, v_order_id, v_product.id, v_presentation.id,
      v_product.name, v_presentation.name, v_product.base_unit,
      v_item.request_mode,
      case when v_item.request_mode = 'money' then null else v_item.requested_quantity end,
      case when v_item.request_mode = 'money' then v_item.requested_money_cents else null end,
      v_estimated_quantity, v_presentation.price_cents, v_presentation.base_quantity,
      v_line_cents,
      coalesce(nullif(v_item.substitution_policy, ''), 'contact'),
      coalesce(v_item.max_substitution_extra_cents, 0)
    );

    perform private.reserve_inventory_fefo(
      v_store_id, v_order_id, v_item_id, v_product.id, v_presentation.id,
      v_estimated_quantity, p_reservation_expires_at
    );
  end loop;

  insert into public.order_status_history (
    store_id, order_id, from_status, to_status, reason_code,
    actor_user_id, operation_id
  ) values (
    v_store_id, v_order_id, null,
    case when v_payment_method = 'cash' then 'queued' else 'pending_payment' end,
    'checkout', v_user_id, p_operation_id
  );

  insert into public.payment_transactions (
    store_id, order_id, transaction_type, method, provider,
    idempotency_key, amount_cents, status
  ) values (
    v_store_id, v_order_id, 'charge', v_payment_method,
    case v_payment_method
      when 'cash' then 'cash_pickup'
      when 'yape' then 'manual_yape'
      when 'plin' then 'manual_plin'
      else 'card_pending_provider'
    end,
    'checkout:' || p_operation_id::text, v_total,
    case when v_payment_method in ('yape', 'plin') then 'requires_action' else 'pending' end
  );

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'status', case when v_payment_method = 'cash' then 'queued' else 'pending_payment' end,
    'payment_status', case when v_payment_method in ('yape', 'plin') then 'requires_action' else 'pending' end,
    'estimated_total_cents', v_total,
    'reservation_expires_at', p_reservation_expires_at,
    'pickup_code', v_pickup_code,
    'idempotent_replay', false
  );
end;
$$;

create or replace function public.create_checkout_order(
  p_payload jsonb,
  p_operation_id uuid,
  p_reservation_expires_at timestamptz
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.create_checkout_order($1, $2, $3);
$$;

revoke all on function private.reserve_inventory_fefo(uuid, uuid, uuid, uuid, uuid, bigint, timestamptz)
  from public, anon;
revoke all on function private.create_checkout_order(jsonb, uuid, timestamptz)
  from public, anon;
revoke all on function public.create_checkout_order(jsonb, uuid, timestamptz)
  from public, anon;

grant usage on schema private to authenticated, service_role;
grant execute on function private.reserve_inventory_fefo(uuid, uuid, uuid, uuid, uuid, bigint, timestamptz)
  to authenticated, service_role;
grant execute on function private.create_checkout_order(jsonb, uuid, timestamptz)
  to authenticated, service_role;
grant execute on function public.create_checkout_order(jsonb, uuid, timestamptz)
  to authenticated;

comment on function public.create_checkout_order(jsonb, uuid, timestamptz) is
  'Checkout autenticado (incluye usuarios anónimos de Supabase), idempotente y con reserva FEFO atómica.';
