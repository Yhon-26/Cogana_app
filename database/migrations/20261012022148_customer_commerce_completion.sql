create or replace function private.guard_commerce_operation(p_store_id uuid,p_operation_id uuid,p_kind text,p_target uuid)
returns void language plpgsql security definer set search_path='' as $$
declare entry private.operation_log%rowtype;
begin
  if p_operation_id is null then raise exception using errcode='22023',message='operation_id es obligatorio'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  select * into entry from private.operation_log where operation_id=p_operation_id;
  if found and (entry.store_id<>p_store_id or entry.operation_kind<>p_kind
    or entry.actor_user_id is distinct from auth.uid()
    or (case when p_kind='complete_delivery' then (entry.result->>'assignment_id')::uuid when p_kind in ('settle_manual_difference','reject_manual_payment') then (entry.result->>'transaction_id')::uuid when p_kind='decide_substitution' then (entry.result->>'substitution_id')::uuid else (entry.result->>'order_id')::uuid end) is distinct from p_target) then
    raise exception using errcode='23505',message='Operación utilizada para otra solicitud';
  end if;
end; $$;

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
  if not exists(select 1 from jsonb_to_recordset(p_items) as x(order_item_id uuid,prepared_quantity bigint) where prepared_quantity>0) then raise exception using errcode='22023',message='Cancela el pedido si no se preparará ningún artículo'; end if;
  update public.order_substitutions set status='expired',decided_at=statement_timestamp(),updated_at=statement_timestamp()
    where store_id=p_store_id and order_id=p_order_id and status='pending' and expires_at<=statement_timestamp();
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
  if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception using errcode='42501',message='Inicia sesión'; end if;
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
  if v_order.requester_user_id is distinct from v_actor and not v_is_staff then
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

create or replace function private.save_customer_account(p_store_id uuid,p_payload jsonb,p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); customer public.customers%rowtype; result jsonb; fingerprint text; previous private.operation_log%rowtype;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception using errcode='42501',message='Inicia sesión para guardar tus datos'; end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception using errcode='22023',message='Datos de cuenta inválidos'; end if;
  if not exists(select 1 from public.stores where id=p_store_id and status='active') then raise exception using errcode='22023',message='Tienda no disponible'; end if;
  if p_operation_id is null then raise exception using errcode='22023',message='Falta operation_id'; end if;
  fingerprint:=encode(extensions.digest(p_payload::text,'sha256'),'hex');
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  select * into previous from private.operation_log where operation_id=p_operation_id;
  if found then
    if previous.actor_user_id is distinct from actor or previous.store_id<>p_store_id or previous.operation_kind<>'save_customer_account' or previous.result->>'fingerprint' is distinct from fingerprint then raise exception using errcode='23505',message='Operación ya utilizada'; end if;
    return previous.result-'fingerprint';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_store_id::text||actor::text,2));
  select * into customer from public.customers where store_id=p_store_id and auth_user_id=actor for update;
  if found and customer.status<>'active' then raise exception using errcode='42501',message='Esta cuenta no permite cambios. Contacta a la tienda'; end if;
  if p_payload ? 'name' then
    if length(coalesce(btrim(p_payload->>'name'),'')) not between 2 and 100 or coalesce(p_payload->>'phone','') !~ '^\+?519[0-9]{8}$|^9[0-9]{8}$' then
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

CREATE OR REPLACE FUNCTION private.create_checkout_order(p_payload jsonb, p_operation_id uuid, p_reservation_expires_at timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      coalesce(nullif(v_item.substitution_policy, ''),(select p.substitution_default from public.customer_preferences p where p.store_id=v_store_id and p.customer_id=v_customer_id),'contact'),
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
$function$;

create or replace function private.delete_customer_address(p_address_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception using errcode='42501',message='Inicia sesión'; end if;
  delete from public.customer_addresses a using public.customers c where a.id=p_address_id and c.store_id=a.store_id and c.id=a.customer_id and c.auth_user_id=auth.uid();
  if not found then raise exception using errcode='42501',message='Dirección no disponible para esta cuenta'; end if;
end; $$;
create or replace function public.delete_customer_address(p_address_id uuid) returns void language sql security invoker set search_path='' as $$ select private.delete_customer_address($1); $$;
revoke all on function public.delete_customer_address(uuid),private.delete_customer_address(uuid) from public,anon;
grant execute on function public.delete_customer_address(uuid),private.delete_customer_address(uuid) to authenticated;

create or replace function private.request_customer_account_deletion()
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); request_id uuid;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception using errcode='42501',message='Inicia sesión para solicitar la eliminación'; end if;
  if exists(select 1 from public.store_memberships where user_id=actor) then raise exception using errcode='42501',message='Las cuentas del equipo deben gestionarse desde administración'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,3));
  select id into request_id from public.account_deletion_requests where user_id=actor and status in ('requested','prepared') order by requested_at desc limit 1;
  if request_id is null then insert into public.account_deletion_requests(user_id,status) values(actor,'requested') returning id into request_id; end if;
  return jsonb_build_object('request_id',request_id,'status','requested');
end; $$;
create or replace function public.request_customer_account_deletion() returns jsonb language sql security invoker set search_path='' as $$ select private.request_customer_account_deletion(); $$;
revoke all on function public.request_customer_account_deletion(),private.request_customer_account_deletion() from public,anon;
grant execute on function public.request_customer_account_deletion(),private.request_customer_account_deletion() to authenticated;

create or replace function private.reject_manual_payment(p_store_id uuid,p_transaction_id uuid,p_reason text,p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); tx public.payment_transactions%rowtype; result jsonb;
begin
  if not private.has_store_role(p_store_id,array['owner','admin']) then raise exception using errcode='42501',message='No autorizado'; end if;
  if nullif(btrim(p_reason),'') is null then raise exception using errcode='22023',message='Indica el motivo verificado'; end if;
  perform 1 from public.orders where store_id=p_store_id and id=(select order_id from public.payment_transactions where id=p_transaction_id and store_id=p_store_id) for update;
  perform private.guard_commerce_operation(p_store_id,p_operation_id,'reject_manual_payment',p_transaction_id);
  select l.result into result from private.operation_log l where operation_id=p_operation_id;
  if found then return result||jsonb_build_object('idempotent_replay',true); end if;
  select * into tx from public.payment_transactions where store_id=p_store_id and id=p_transaction_id for update;
  if not found or tx.transaction_type<>'charge' or tx.provider not in ('manual_yape','manual_plin') or tx.status not in ('pending','requires_action','processing')
    or not exists(select 1 from public.orders where store_id=p_store_id and id=tx.order_id and status='pending_payment') then
    raise exception using errcode='P0001',message='El cobro no puede rechazarse en este estado'; end if;
  update public.payment_transactions set status='failed',failure_code='manual_not_received',failure_message=left(btrim(p_reason),250),updated_at=statement_timestamp() where id=tx.id;
  perform private.transition_order(p_store_id,tx.order_id,'cancelled',gen_random_uuid(),'payment_not_received',left(btrim(p_reason),250));
  perform private.refresh_order_payment_status(p_store_id,tx.order_id);
  result:=jsonb_build_object('transaction_id',tx.id,'order_id',tx.order_id,'status','failed');
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result) values(p_operation_id,p_store_id,'reject_manual_payment',actor,result);
  return result;
end; $$;
create or replace function public.reject_manual_payment(p_store_id uuid,p_transaction_id uuid,p_reason text,p_operation_id uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.reject_manual_payment($1,$2,$3,$4); $$;
revoke all on function public.reject_manual_payment(uuid,uuid,text,uuid),private.reject_manual_payment(uuid,uuid,text,uuid) from public,anon;
grant execute on function public.reject_manual_payment(uuid,uuid,text,uuid),private.reject_manual_payment(uuid,uuid,text,uuid) to authenticated;
