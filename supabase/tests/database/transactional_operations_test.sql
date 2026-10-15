begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(33);

select is(
  (select count(*)::integer from information_schema.tables
   where table_schema = 'public' and table_type = 'BASE TABLE'),
  37,
  'el esquema público conserva 37 tablas del MVP'
);

select is(
  (select count(*)::integer
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity),
  37,
  'todas las tablas públicas tienen RLS'
);

select is(
  (select count(*)::integer
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prosecdef),
  0,
  'no existen funciones SECURITY DEFINER en public'
);

select ok(
  (select bool_and('search_path=""' = any(p.proconfig))
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'private' and p.prosecdef),
  'todas las funciones privadas privilegiadas fijan search_path vacío'
);

select is(
  has_function_privilege(
    'anon',
    'public.create_checkout_order(jsonb,uuid,timestamptz)',
    'execute'
  ),
  false,
  'anon no ejecuta checkout'
);

select is(
  has_function_privilege(
    'authenticated',
    'public.create_checkout_order(jsonb,uuid,timestamptz)',
    'execute'
  ),
  true,
  'authenticated sí ejecuta checkout'
);

select is(
  has_function_privilege(
    'service_role',
    'private.record_payment_event(text,text,text,jsonb,boolean,uuid,text,text)',
    'execute'
  ),
  true,
  'service_role puede registrar eventos de pago'
);

select is(
  has_function_privilege(
    'authenticated',
    'private.record_payment_event(text,text,text,jsonb,boolean,uuid,text,text)',
    'execute'
  ),
  false,
  'authenticated no registra eventos de proveedor'
);

select is(
  has_schema_privilege('anon', 'private', 'usage'),
  false,
  'anon no tiene USAGE sobre private'
);

create temporary table cogana_test_results (
  key text primary key,
  value jsonb not null
) on commit drop;

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_anonymous
) values
  (
    '33333333-3333-4333-8333-333333333331',
    'authenticated', 'authenticated', 'owner-test@invalid.local',
    '{}'::jsonb, '{}'::jsonb, now(), now(), false
  ),
  (
    '33333333-3333-4333-8333-333333333332',
    'authenticated', 'authenticated', 'buyer-test@invalid.local',
    '{}'::jsonb, '{}'::jsonb, now(), now(), true
  );

insert into public.profiles (id, full_name)
values ('33333333-3333-4333-8333-333333333331', 'TEST Owner');

insert into public.store_memberships (store_id, user_id, role)
values (
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  '33333333-3333-4333-8333-333333333331',
  'owner'
);

insert into public.categories (id, store_id, name, slug)
values (
  '33333333-3333-4333-8333-333333333333',
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  'TEST Transactional',
  'test-transactional'
);

insert into public.products (
  id, store_id, category_id, name, base_unit, tracks_expiration
) values (
  '33333333-3333-4333-8333-333333333334',
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  '33333333-3333-4333-8333-333333333333',
  'TEST Product',
  'gram',
  true
);

insert into public.product_presentations (
  id, store_id, product_id, name, kind, base_quantity, price_mode,
  price_cents, allows_quantity_input, allows_money_input,
  minimum_quantity, quantity_step, is_sealed
) values
  (
    '33333333-3333-4333-8333-333333333335',
    '03c25d8b-847f-4021-86bb-22d1955bbe6e',
    '33333333-3333-4333-8333-333333333334',
    'TEST Bulk', 'bulk', 1000, 'proportional', 400,
    true, true, 50, 50, false
  ),
  (
    '33333333-3333-4333-8333-333333333336',
    '03c25d8b-847f-4021-86bb-22d1955bbe6e',
    '33333333-3333-4333-8333-333333333334',
    'TEST Sealed', 'sack', 1000, 'fixed', 300,
    false, false, 1, 1, true
  );

insert into public.inventory_lots (
  id, store_id, product_id, lot_code, expires_on, loose_on_hand_quantity
) values
  (
    '33333333-3333-4333-8333-333333333337',
    '03c25d8b-847f-4021-86bb-22d1955bbe6e',
    '33333333-3333-4333-8333-333333333334',
    'TEST-EARLY', current_date + 10, 500
  ),
  (
    '33333333-3333-4333-8333-333333333338',
    '03c25d8b-847f-4021-86bb-22d1955bbe6e',
    '33333333-3333-4333-8333-333333333334',
    'TEST-LATE', current_date + 20, 500
  );

insert into public.inventory_lot_packages (
  id, store_id, lot_id, presentation_id, sealed_on_hand_units
) values (
  '33333333-3333-4333-8333-333333333339',
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  '33333333-3333-4333-8333-333333333337',
  '33333333-3333-4333-8333-333333333336',
  2
);

select set_config(
  'request.jwt.claim.sub',
  '33333333-3333-4333-8333-333333333332',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":true}',
  true
);

-- Defensa en profundidad: incluso una membresía asignada por error no debe
-- convertir una identidad anónima en personal de tienda.
insert into public.store_memberships (store_id, user_id, role)
values (
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  '33333333-3333-4333-8333-333333333332',
  'owner'
);

select is(
  private.has_store_role(
    '03c25d8b-847f-4021-86bb-22d1955bbe6e',
    array['owner']
  ),
  false,
  'una identidad anónima no obtiene privilegios de personal aun con membresía'
);

-- Test-only opening: transaction rolls back the real operational state.
select throws_ok(
  $$select public.create_checkout_order('{}'::jsonb,gen_random_uuid(),now()+interval '15 minutes')$$,
  '42501','Inicia sesión para crear tu pedido','checkout rejects anonymous identities'
);
-- The customer flow now requires a verified identity; retain the anonymous staff test above.
delete from public.store_memberships where user_id='33333333-3333-4333-8333-333333333332';
update auth.users set is_anonymous=false where id='33333333-3333-4333-8333-333333333332';
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);
update public.store_operational_state set status='accepting_orders'
where store_id='03c25d8b-847f-4021-86bb-22d1955bbe6e';

insert into cogana_test_results (key, value)
select 'checkout', public.create_checkout_order(
  jsonb_build_object(
    'store_id', '03c25d8b-847f-4021-86bb-22d1955bbe6e',
    'source', 'web',
    'scheduled_for', (((statement_timestamp() at time zone 'America/Lima')::date + 2) + time '07:00') at time zone 'America/Lima',
    'fulfillment_type', 'pickup',
    'payment_method', 'cash',
    'customer', jsonb_build_object(
      'name', 'TEST Buyer',
      'phone', '999000000'
    ),
    'items', jsonb_build_array(jsonb_build_object(
      'presentation_id', '33333333-3333-4333-8333-333333333335',
      'request_mode', 'money',
      'requested_money_cents', 300,
      'substitution_policy', 'contact',
      'max_substitution_extra_cents', 0
    ))
  ),
  '33333333-3333-4333-8333-333333333340',
  now() + interval '30 minutes'
);

-- Public catalog uses presentation UUIDs and net eligible inventory.
select is((select (x->>'available_quantity')::bigint from jsonb_array_elements(public.get_customer_catalog('cogana-santa-anita')) x where x->>'id'='33333333-3333-4333-8333-333333333335'),250::bigint,'catalog deducts the active 750g loose reservation');
select is((select (x->>'available_quantity')::bigint from jsonb_array_elements(public.get_customer_catalog('cogana-santa-anita')) x where x->>'id'='33333333-3333-4333-8333-333333333336'),2000::bigint,'sealed stock remains independent from loose reservations');
-- Restore test rows explicitly so pgTAP counters survive each assertion.
update public.inventory_lots set status='blocked' where id='33333333-3333-4333-8333-333333333337';
update public.inventory_lots set expires_on=current_date-2 where id='33333333-3333-4333-8333-333333333338';
select is((select (x->>'available_quantity')::bigint from jsonb_array_elements(public.get_customer_catalog('cogana-santa-anita')) x where x->>'id'='33333333-3333-4333-8333-333333333335'),0::bigint,'blocked and expired lots are not offered');
update public.inventory_lots set status='available' where id='33333333-3333-4333-8333-333333333337';
update public.inventory_lots set expires_on=current_date+20 where id='33333333-3333-4333-8333-333333333338';
update public.product_presentations set is_active=true where id='33333333-3333-4333-8333-333333333336';
update public.categories set is_active=true where id='33333333-3333-4333-8333-333333333333';
update public.product_presentations set is_active=false where id='33333333-3333-4333-8333-333333333336';
select is((select count(*)::integer from jsonb_array_elements(public.get_customer_catalog('cogana-santa-anita')) x where x->>'id'='33333333-3333-4333-8333-333333333336'),0,'inactive presentation is hidden');
update public.inventory_lots set status='available' where id='33333333-3333-4333-8333-333333333337';
update public.inventory_lots set expires_on=current_date+20 where id='33333333-3333-4333-8333-333333333338';
update public.product_presentations set is_active=true where id='33333333-3333-4333-8333-333333333336';
update public.categories set is_active=true where id='33333333-3333-4333-8333-333333333333';
update public.categories set is_active=false where id='33333333-3333-4333-8333-333333333333';
select is((select count(*)::integer from jsonb_array_elements(public.get_customer_catalog('cogana-santa-anita')) x where x->>'product_id'='33333333-3333-4333-8333-333333333334'),0,'inactive category is hidden');
update public.inventory_lots set status='available' where id='33333333-3333-4333-8333-333333333337';
update public.inventory_lots set expires_on=current_date+20 where id='33333333-3333-4333-8333-333333333338';
update public.product_presentations set is_active=true where id='33333333-3333-4333-8333-333333333336';
update public.categories set is_active=true where id='33333333-3333-4333-8333-333333333333';

insert into cogana_test_results (key, value)
select 'checkout_replay', public.create_checkout_order(
  jsonb_build_object(
    'store_id', '03c25d8b-847f-4021-86bb-22d1955bbe6e',
    'source', 'web',
    'scheduled_for', (((statement_timestamp() at time zone 'America/Lima')::date + 2) + time '07:00') at time zone 'America/Lima',
    'fulfillment_type', 'pickup',
    'payment_method', 'cash',
    'customer', jsonb_build_object(
      'name', 'TEST Buyer',
      'phone', '999000000'
    ),
    'items', jsonb_build_array(jsonb_build_object(
      'presentation_id', '33333333-3333-4333-8333-333333333335',
      'request_mode', 'money',
      'requested_money_cents', 300,
      'substitution_policy', 'contact',
      'max_substitution_extra_cents', 0
    ))
  ),
  '33333333-3333-4333-8333-333333333340',
  now() + interval '30 minutes'
);

select set_config(
  'request.jwt.claim.sub',
  '33333333-3333-4333-8333-333333333331',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',
  true
);

insert into cogana_test_results (key, value)
select 'open_package', public.open_inventory_package(
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  '33333333-3333-4333-8333-333333333337',
  '33333333-3333-4333-8333-333333333336',
  1,
  '33333333-3333-4333-8333-333333333341',
  'pgTAP'
);

insert into cogana_test_results (key, value)
select 'open_package_replay', public.open_inventory_package(
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  '33333333-3333-4333-8333-333333333337',
  '33333333-3333-4333-8333-333333333336',
  1,
  '33333333-3333-4333-8333-333333333341',
  'pgTAP'
);

select public.transition_order(
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  (select (value->>'order_id')::uuid from cogana_test_results where key = 'checkout'),
  'confirmed',
  '33333333-3333-4333-8333-333333333342',
  'pgtap',
  null
);

select public.transition_order(
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  (select (value->>'order_id')::uuid from cogana_test_results where key = 'checkout'),
  'preparing',
  '33333333-3333-4333-8333-333333333343',
  'pgtap',
  null
);

select public.finalize_weighted_order(
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  (select (value->>'order_id')::uuid from cogana_test_results where key = 'checkout'),
  (
    select jsonb_agg(jsonb_build_object(
      'order_item_id', id,
      'prepared_quantity', 750
    ))
    from public.order_items
    where order_id = (
      select (value->>'order_id')::uuid
      from cogana_test_results where key = 'checkout'
    )
  ),
  '33333333-3333-4333-8333-333333333344'
);

select public.transition_order(
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  (select (value->>'order_id')::uuid from cogana_test_results where key = 'checkout'),
  'ready_for_pickup',
  '33333333-3333-4333-8333-333333333345',
  'pgtap',
  null
);

select public.complete_pickup(
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  (select (value->>'order_id')::uuid from cogana_test_results where key = 'checkout'),
  (select value->>'pickup_code' from cogana_test_results where key = 'checkout'),
  '33333333-3333-4333-8333-333333333346'
);

select is(
  (select reserved_quantity from public.inventory_reservations limit 1),
  750::bigint,
  'S/ 3 a S/ 4 por kg reserva 750 gramos'
);

select is(
  (select sum(allocated_base_quantity)::bigint
   from public.inventory_reservation_allocations),
  750::bigint,
  'la reserva queda completamente asignada'
);

select is(
  (select allocated_base_quantity
   from public.inventory_reservation_allocations
   where lot_id = '33333333-3333-4333-8333-333333333337'),
  500::bigint,
  'FEFO consume primero todo el lote de vencimiento más cercano'
);

select is(
  (select count(*)::integer from public.orders
   where operation_id = '33333333-3333-4333-8333-333333333340'),
  1,
  'repetir checkout no duplica el pedido'
);

select is(
  (select (value->>'idempotent_replay')::boolean
   from cogana_test_results where key = 'checkout_replay'),
  true,
  'el reintento de checkout se identifica como replay'
);

select is(
  (select sealed_on_hand_units from public.inventory_lot_packages
   where id = '33333333-3333-4333-8333-333333333339'),
  1::bigint,
  'abrir un saco reduce una unidad sellada'
);

select is(
  (select count(*)::integer from public.inventory_movements
   where operation_id = '33333333-3333-4333-8333-333333333341'),
  1,
  'repetir apertura no duplica el movimiento'
);

select is(
  (select status from public.orders limit 1),
  'completed',
  'el recojo con código completa el pedido'
);

select is(
  (select payment_status from public.orders limit 1),
  'paid',
  'el recojo en efectivo confirma el pago'
);

select is(
  (select final_total_cents from public.orders limit 1),
  300::bigint,
  'el pesaje final conserva el total esperado'
);

select is(
  (select consumed_quantity from public.inventory_reservations limit 1),
  750::bigint,
  'la preparación consume exactamente la reserva'
);

select is(
  (select loose_on_hand_quantity from public.inventory_lots
   where id = '33333333-3333-4333-8333-333333333337'),
  1000::bigint,
  'el lote temprano refleja apertura y consumo sin pérdida neta'
);

select is(
  (select loose_on_hand_quantity from public.inventory_lots
   where id = '33333333-3333-4333-8333-333333333338'),
  250::bigint,
  'el lote tardío aporta sólo el saldo requerido'
);

select is(
  (select status from public.inventory_reservations limit 1),
  'consumed',
  'la reserva queda marcada como consumida'
);

select is(
  (select count(*)::integer from private.operation_log
   where actor_user_id = '33333333-3333-4333-8333-333333333331'),
  2,
  'las operaciones complejas dejan registro idempotente privado'
);

update public.product_presentations
set price_cents = price_cents + 1
where id = '33333333-3333-4333-8333-333333333335';

select is(
  (select count(*)::integer
   from public.product_price_history
   where presentation_id = '33333333-3333-4333-8333-333333333335'
     and old_price_cents = 400
     and new_price_cents = 401),
  1,
  'cambiar un precio crea exactamente una fila de historial'
);

select is(
  (select changed_by
   from public.product_price_history
   where presentation_id = '33333333-3333-4333-8333-333333333335'
     and old_price_cents = 400
     and new_price_cents = 401),
  '33333333-3333-4333-8333-333333333331'::uuid,
  'el historial identifica al propietario que cambió el precio'
);

select * from finish();
rollback;
