begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

create temporary table commerce_tap_output(line text);
select no_plan();

insert into commerce_tap_output select is(
  (select count(*)::integer from information_schema.tables
   where table_schema = 'public' and table_type = 'BASE TABLE'),
  37,
  'el esquema público conserva 37 tablas del MVP'
);

insert into commerce_tap_output select is(
  (select count(*)::integer
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity),
  37,
  'todas las tablas públicas tienen RLS'
);

insert into commerce_tap_output select is(
  (select count(*)::integer
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prosecdef),
  0,
  'no existen funciones SECURITY DEFINER en public'
);

insert into commerce_tap_output select ok(
  (select bool_and('search_path=""' = any(p.proconfig))
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'private' and p.prosecdef),
  'todas las funciones privadas privilegiadas fijan search_path vacío'
);

insert into commerce_tap_output select is(
  has_function_privilege(
    'anon',
    'public.create_checkout_order(jsonb,uuid,timestamptz)',
    'execute'
  ),
  false,
  'anon no ejecuta checkout'
);

insert into commerce_tap_output select is(
  has_function_privilege(
    'authenticated',
    'public.create_checkout_order(jsonb,uuid,timestamptz)',
    'execute'
  ),
  true,
  'authenticated sí ejecuta checkout'
);

insert into commerce_tap_output select is(
  has_function_privilege(
    'service_role',
    'private.record_payment_event(text,text,text,jsonb,boolean,uuid,text,text)',
    'execute'
  ),
  true,
  'service_role puede registrar eventos de pago'
);

insert into commerce_tap_output select is(
  has_function_privilege(
    'authenticated',
    'private.record_payment_event(text,text,text,jsonb,boolean,uuid,text,text)',
    'execute'
  ),
  false,
  'authenticated no registra eventos de proveedor'
);

insert into commerce_tap_output select is(
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

insert into commerce_tap_output select is(
  private.has_store_role(
    '03c25d8b-847f-4021-86bb-22d1955bbe6e',
    array['owner']
  ),
  false,
  'una identidad anónima no obtiene privilegios de personal aun con membresía'
);

-- Test-only opening: transaction rolls back the real operational state.
insert into commerce_tap_output select throws_ok(
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
insert into commerce_tap_output select is((select (x->>'available_quantity')::bigint from jsonb_array_elements(public.get_customer_catalog('cogana-santa-anita')) x where x->>'id'='33333333-3333-4333-8333-333333333335'),250::bigint,'catalog deducts the active 750g loose reservation');
insert into commerce_tap_output select is((select (x->>'available_quantity')::bigint from jsonb_array_elements(public.get_customer_catalog('cogana-santa-anita')) x where x->>'id'='33333333-3333-4333-8333-333333333336'),2000::bigint,'sealed stock remains independent from loose reservations');
-- Restore test rows explicitly so pgTAP counters survive each assertion.
update public.inventory_lots set status='blocked' where id='33333333-3333-4333-8333-333333333337';
update public.inventory_lots set expires_on=current_date-2 where id='33333333-3333-4333-8333-333333333338';
insert into commerce_tap_output select is((select (x->>'available_quantity')::bigint from jsonb_array_elements(public.get_customer_catalog('cogana-santa-anita')) x where x->>'id'='33333333-3333-4333-8333-333333333335'),0::bigint,'blocked and expired lots are not offered');
update public.inventory_lots set status='available' where id='33333333-3333-4333-8333-333333333337';
update public.inventory_lots set expires_on=current_date+20 where id='33333333-3333-4333-8333-333333333338';
update public.product_presentations set is_active=true where id='33333333-3333-4333-8333-333333333336';
update public.categories set is_active=true where id='33333333-3333-4333-8333-333333333333';
update public.product_presentations set is_active=false where id='33333333-3333-4333-8333-333333333336';
insert into commerce_tap_output select is((select count(*)::integer from jsonb_array_elements(public.get_customer_catalog('cogana-santa-anita')) x where x->>'id'='33333333-3333-4333-8333-333333333336'),0,'inactive presentation is hidden');
update public.inventory_lots set status='available' where id='33333333-3333-4333-8333-333333333337';
update public.inventory_lots set expires_on=current_date+20 where id='33333333-3333-4333-8333-333333333338';
update public.product_presentations set is_active=true where id='33333333-3333-4333-8333-333333333336';
update public.categories set is_active=true where id='33333333-3333-4333-8333-333333333333';
update public.categories set is_active=false where id='33333333-3333-4333-8333-333333333333';
insert into commerce_tap_output select is((select count(*)::integer from jsonb_array_elements(public.get_customer_catalog('cogana-santa-anita')) x where x->>'product_id'='33333333-3333-4333-8333-333333333334'),0,'inactive category is hidden');
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

insert into commerce_tap_output select is(
  (select reserved_quantity from public.inventory_reservations limit 1),
  750::bigint,
  'S/ 3 a S/ 4 por kg reserva 750 gramos'
);

insert into commerce_tap_output select is(
  (select sum(allocated_base_quantity)::bigint
   from public.inventory_reservation_allocations),
  750::bigint,
  'la reserva queda completamente asignada'
);

insert into commerce_tap_output select is(
  (select allocated_base_quantity
   from public.inventory_reservation_allocations
   where lot_id = '33333333-3333-4333-8333-333333333337'),
  500::bigint,
  'FEFO consume primero todo el lote de vencimiento más cercano'
);

insert into commerce_tap_output select is(
  (select count(*)::integer from public.orders
   where operation_id = '33333333-3333-4333-8333-333333333340'),
  1,
  'repetir checkout no duplica el pedido'
);

insert into commerce_tap_output select is(
  (select (value->>'idempotent_replay')::boolean
   from cogana_test_results where key = 'checkout_replay'),
  true,
  'el reintento de checkout se identifica como replay'
);

insert into commerce_tap_output select is(
  (select sealed_on_hand_units from public.inventory_lot_packages
   where id = '33333333-3333-4333-8333-333333333339'),
  1::bigint,
  'abrir un saco reduce una unidad sellada'
);

insert into commerce_tap_output select is(
  (select count(*)::integer from public.inventory_movements
   where operation_id = '33333333-3333-4333-8333-333333333341'),
  1,
  'repetir apertura no duplica el movimiento'
);

insert into commerce_tap_output select is(
  (select status from public.orders limit 1),
  'completed',
  'el recojo con código completa el pedido'
);

insert into commerce_tap_output select is(
  (select payment_status from public.orders limit 1),
  'paid',
  'el recojo en efectivo confirma el pago'
);

insert into commerce_tap_output select is(
  (select final_total_cents from public.orders limit 1),
  300::bigint,
  'el pesaje final conserva el total esperado'
);

insert into commerce_tap_output select is(
  (select consumed_quantity from public.inventory_reservations limit 1),
  750::bigint,
  'la preparación consume exactamente la reserva'
);

insert into commerce_tap_output select is(
  (select loose_on_hand_quantity from public.inventory_lots
   where id = '33333333-3333-4333-8333-333333333337'),
  1000::bigint,
  'el lote temprano refleja apertura y consumo sin pérdida neta'
);

insert into commerce_tap_output select is(
  (select loose_on_hand_quantity from public.inventory_lots
   where id = '33333333-3333-4333-8333-333333333338'),
  250::bigint,
  'el lote tardío aporta sólo el saldo requerido'
);

insert into commerce_tap_output select is(
  (select status from public.inventory_reservations limit 1),
  'consumed',
  'la reserva queda marcada como consumida'
);

insert into commerce_tap_output select is(
  (select count(*)::integer from private.operation_log
   where actor_user_id = '33333333-3333-4333-8333-333333333331'),
  2,
  'las operaciones complejas dejan registro idempotente privado'
);

update public.product_presentations
set price_cents = price_cents + 1
where id = '33333333-3333-4333-8333-333333333335';

insert into commerce_tap_output select is(
  (select count(*)::integer
   from public.product_price_history
   where presentation_id = '33333333-3333-4333-8333-333333333335'
     and old_price_cents = 400
     and new_price_cents = 401),
  1,
  'cambiar un precio crea exactamente una fila de historial'
);

insert into commerce_tap_output select is(
  (select changed_by
   from public.product_price_history
   where presentation_id = '33333333-3333-4333-8333-333333333335'
     and old_price_cents = 400
     and new_price_cents = 401),
  '33333333-3333-4333-8333-333333333331'::uuid,
  'el historial identifica al propietario que cambió el precio'
);

insert into commerce_tap_output select ok(not has_table_privilege('authenticated','private.customer_fulfillment_codes','select'),'fulfillment codes have no direct client access');

insert into commerce_tap_output select ok(not has_function_privilege('anon','public.get_customer_order_details(uuid)','execute'),'anonymous role cannot read order details');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',true);

insert into cogana_test_results select 'receipt',public.receive_inventory_lot('03c25d8b-847f-4021-86bb-22d1955bbe6e','33333333-3333-4333-8333-333333333334','TEST-RECEIPT',current_date+30,null,100,jsonb_build_array(jsonb_build_object('presentation_id','33333333-3333-4333-8333-333333333336','units',3)),null,'44444444-4444-4444-8444-000000000010');

insert into commerce_tap_output select lives_ok($$select public.receive_inventory_lot('03c25d8b-847f-4021-86bb-22d1955bbe6e','33333333-3333-4333-8333-333333333334','TEST-RECEIPT',current_date+30,null,100,jsonb_build_array(jsonb_build_object('presentation_id','33333333-3333-4333-8333-333333333336','units',3)),null,'44444444-4444-4444-8444-000000000010')$$,'inventory receipt retry');

insert into commerce_tap_output select is((select count(*)::integer from public.inventory_movements where operation_id='44444444-4444-4444-8444-000000000010'),1,'receipt retries do not duplicate stock');

insert into commerce_tap_output select is((select base_quantity_delta from public.inventory_movements where operation_id='44444444-4444-4444-8444-000000000010'),3100::bigint,'receipt counts sealed base quantities');

insert into commerce_tap_output select throws_ok($$select public.receive_inventory_lot('03c25d8b-847f-4021-86bb-22d1955bbe6e','33333333-3333-4333-8333-333333333334','TEST-RECEIPT',current_date+30,null,101,jsonb_build_array(jsonb_build_object('presentation_id','33333333-3333-4333-8333-333333333336','units',3)),null,'44444444-4444-4444-8444-000000000010')$$,'23505',NULL,'changed receipt intent cannot reuse operation');

insert into commerce_tap_output select throws_ok($$select public.receive_inventory_lot('03c25d8b-847f-4021-86bb-22d1955bbe6e','33333333-3333-4333-8333-333333333334','TEST-EXPIRED',(statement_timestamp() at time zone 'America/Lima')::date-1,null,100,null,null,'44444444-4444-4444-8444-000000000011')$$,'22023',NULL,'expired receipt rejected');

insert into commerce_tap_output select throws_ok($$select public.receive_inventory_lot('03c25d8b-847f-4021-86bb-22d1955bbe6e','33333333-3333-4333-8333-333333333334','TEST-NEGATIVE',current_date+30,null,0,jsonb_build_array(jsonb_build_object('presentation_id','33333333-3333-4333-8333-333333333336','units',-1)),null,'44444444-4444-4444-8444-000000000012')$$,'22023',NULL,'negative package count rejected');

insert into commerce_tap_output select throws_ok($$select public.receive_inventory_lot('03c25d8b-847f-4021-86bb-22d1955bbe6e','33333333-3333-4333-8333-333333333334','TEST-DUP',current_date+30,null,0,jsonb_build_array(jsonb_build_object('presentation_id','33333333-3333-4333-8333-333333333336','units',1),jsonb_build_object('presentation_id','33333333-3333-4333-8333-333333333336','units',1)),null,'44444444-4444-4444-8444-000000000013')$$,'22023',NULL,'duplicate package presentation rejected');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select lives_ok($$select public.save_customer_account('03c25d8b-847f-4021-86bb-22d1955bbe6e','{"name":"TEST Buyer","phone":"999000000","preferences":{"substitution_default":"allow_similar","order_notifications":false}}','44444444-4444-4444-8444-000000000014')$$,'customer saves profile and preferences');

insert into commerce_tap_output select lives_ok($$select public.save_customer_account('03c25d8b-847f-4021-86bb-22d1955bbe6e','{"address":{"label":"TEST Home","address_line":"TEST Address","district":"Santa Anita","is_default":true}}','44444444-4444-4444-8444-000000000015')$$,'customer creates address');

insert into commerce_tap_output select lives_ok($$select public.save_customer_account('03c25d8b-847f-4021-86bb-22d1955bbe6e','{"address":{"label":"TEST Home","address_line":"TEST Address","district":"Santa Anita","is_default":true}}','44444444-4444-4444-8444-000000000015')$$,'address retry');

insert into commerce_tap_output select is((select jsonb_array_length(public.get_customer_account('cogana-santa-anita')->'addresses')),1,'address retry creates one row');

insert into commerce_tap_output select lives_ok($$select public.save_customer_account('03c25d8b-847f-4021-86bb-22d1955bbe6e','{"address":{"label":"TEST Second","address_line":"TEST Address","district":"Santa Anita","is_default":true}}','44444444-4444-4444-8444-000000000016')$$,'customer changes default address');

insert into commerce_tap_output select is((select count(*)::integer from public.customer_addresses where customer_id=(select id from public.customers where auth_user_id='33333333-3333-4333-8333-333333333332') and is_default),1,'only one default address');

insert into commerce_tap_output select is((select jsonb_array_length(public.get_customer_notifications('cogana-santa-anita'))),0,'disabled order notices hide inbox history');

insert into commerce_tap_output select is(public.get_customer_order_details((select (value->>'order_id')::uuid from cogana_test_results where key='checkout'))->>'confirmation_code',NULL::text,'completed orders hide handover codes');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select throws_ok($$select public.get_customer_order_details((select (value->>'order_id')::uuid from cogana_test_results where key='checkout'))$$,'42501',NULL,'staff cannot read customer-only details');

insert into commerce_tap_output select throws_ok($$select public.request_customer_account_deletion()$$,'42501',NULL,'team accounts cannot request customer deletion');

insert into auth.users(id,aud,role,email,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,is_anonymous) values('44444444-4444-4444-8444-000000000001','authenticated','authenticated','TEST-other@invalid.local','{}','{}',now(),now(),false);

select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-000000000001',true),set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-000000000001","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select throws_ok($$select public.get_customer_order_details((select (value->>'order_id')::uuid from cogana_test_results where key='checkout'))$$,'42501',NULL,'another customer cannot read order');

insert into commerce_tap_output select throws_ok($$select public.delete_customer_address((select id from public.customer_addresses limit 1))$$,'42501',NULL,'another customer cannot delete address');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select lives_ok($$select public.request_customer_account_deletion()$$,'deletion request recorded without deleting account');

insert into commerce_tap_output select lives_ok($$select public.request_customer_account_deletion()$$,'deletion request retry');

insert into commerce_tap_output select is((select count(*)::integer from public.account_deletion_requests where user_id='33333333-3333-4333-8333-333333333332'),1,'one outstanding deletion request');

insert into commerce_tap_output select ok(exists(select 1 from auth.users where id='33333333-3333-4333-8333-333333333332'),'privacy request preserves Auth until explicit processing');

insert into cogana_test_results select 'cancelled',public.submit_customer_order(jsonb_build_object('store_id','03c25d8b-847f-4021-86bb-22d1955bbe6e','source','android','fulfillment_type','pickup','payment_method','yape','scheduled_for',(((statement_timestamp() at time zone 'America/Lima')::date+2)+time '08:00') at time zone 'America/Lima','customer',jsonb_build_object('name','TEST Buyer','phone','999000000'),'delivery_zone_id',null,'delivery_address',null,'items',jsonb_build_array(jsonb_build_object('presentation_id','33333333-3333-4333-8333-333333333336','request_mode','presentation','requested_quantity',1))),'44444444-4444-4444-8444-000000000017');

insert into commerce_tap_output select is((select substitution_policy from public.order_items where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='cancelled')),'allow_similar'::text,'checkout applies saved substitution preference');

insert into commerce_tap_output select lives_ok($$select public.cancel_customer_order((select (value->>'order_id')::uuid from cogana_test_results where key='cancelled'),'44444444-4444-4444-8444-000000000018')$$,'customer cancels unpaid order');

insert into commerce_tap_output select is((select status from public.inventory_reservations where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='cancelled')),'released'::text,'unpaid cancellation releases stock');

insert into cogana_test_results select 'rejected',public.submit_customer_order(jsonb_build_object('store_id','03c25d8b-847f-4021-86bb-22d1955bbe6e','source','android','fulfillment_type','pickup','payment_method','yape','scheduled_for',(((statement_timestamp() at time zone 'America/Lima')::date+2)+time '08:00') at time zone 'America/Lima','customer',jsonb_build_object('name','TEST Buyer','phone','999000000'),'delivery_zone_id',null,'delivery_address',null,'items',jsonb_build_array(jsonb_build_object('presentation_id','33333333-3333-4333-8333-333333333336','request_mode','presentation','requested_quantity',1))),'44444444-4444-4444-8444-000000000019');

insert into commerce_tap_output select lives_ok($$select public.report_customer_payment((select (value->>'order_id')::uuid from cogana_test_results where key='rejected'),'TEST-REFERENCE-REJECTED')$$,'customer reports payment for review');

insert into commerce_tap_output select throws_ok($$select public.cancel_customer_order((select (value->>'order_id')::uuid from cogana_test_results where key='rejected'),'44444444-4444-4444-8444-000000000020')$$,'P0001',NULL,'customer cannot bypass payment review with cancellation');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select throws_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='rejected'),'queued','44444444-4444-4444-8444-000000000021')$$,'P0001',NULL,'unverified digital payment cannot queue order');

insert into commerce_tap_output select lives_ok($$select public.reject_manual_payment('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select id from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='rejected') and transaction_type='charge' limit 1),'TEST no incoming money','44444444-4444-4444-8444-000000000022')$$,'staff rejects unreceived payment and cancels');

insert into commerce_tap_output select is((select status from public.inventory_reservations where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='rejected')),'released'::text,'rejected payment releases indefinite reservation');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);

insert into cogana_test_results select 'digital',public.submit_customer_order(jsonb_build_object('store_id','03c25d8b-847f-4021-86bb-22d1955bbe6e','source','android','fulfillment_type','pickup','payment_method','yape','scheduled_for',(((statement_timestamp() at time zone 'America/Lima')::date+2)+time '08:00') at time zone 'America/Lima','customer',jsonb_build_object('name','TEST Buyer','phone','999000000'),'delivery_zone_id',null,'delivery_address',null,'items',jsonb_build_array(jsonb_build_object('presentation_id','33333333-3333-4333-8333-333333333336','request_mode','presentation','requested_quantity',2))),'44444444-4444-4444-8444-000000000023');

insert into commerce_tap_output select lives_ok($$select public.report_customer_payment((select (value->>'order_id')::uuid from cogana_test_results where key='digital'),'TEST-REFERENCE-DIGITAL')$$,'report digital payment');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select lives_ok($$select public.confirm_manual_payment('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='digital'),(select id from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='digital') and transaction_type='charge' limit 1),'44444444-4444-4444-8444-000000000024','TEST-VERIFIED-digital')$$,'verified manual payment digital');

insert into commerce_tap_output select lives_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='digital'),'confirmed','44444444-4444-4444-8444-000000000025')$$,'advance digital to confirmed');

insert into commerce_tap_output select lives_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='digital'),'preparing','44444444-4444-4444-8444-000000000026')$$,'advance digital to preparing');

insert into commerce_tap_output select throws_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='digital'),'ready_for_pickup','44444444-4444-4444-8444-000000000027')$$,'P0001',NULL,'unprepared order cannot become ready');

update public.order_items set substitution_policy='contact' where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='digital');

insert into cogana_test_results select 'proposal',public.propose_substitution('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='digital'),(select id from public.order_items where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='digital') limit 1),'33333333-3333-4333-8333-333333333335',1000,now()+interval '30 minutes','44444444-4444-4444-8444-000000000028');

insert into commerce_tap_output select throws_ok($$select public.finalize_weighted_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='digital'),jsonb_build_array(jsonb_build_object('order_item_id',(select id from public.order_items where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='digital') limit 1),'prepared_quantity',1000)),'44444444-4444-4444-8444-000000000029')$$,'P0001',NULL,'pending substitution prevents finalization');

select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-000000000001',true),set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-000000000001","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select throws_ok($$select public.decide_substitution('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'substitution_id')::uuid from cogana_test_results where key='proposal'),'accepted','44444444-4444-4444-8444-000000000030')$$,'42501',NULL,'other customer cannot decide substitution');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select lives_ok($$select public.decide_substitution('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'substitution_id')::uuid from cogana_test_results where key='proposal'),'accepted','44444444-4444-4444-8444-000000000031')$$,'customer accepts replacement and server reserves it');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select throws_ok($$select public.finalize_weighted_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='digital'),jsonb_build_array(jsonb_build_object('order_item_id',(select id from public.order_items where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='digital') limit 1),'prepared_quantity',0)),'44444444-4444-4444-8444-000000000032')$$,'22023',NULL,'empty prepared order must be cancelled');

insert into commerce_tap_output select lives_ok($$select public.finalize_weighted_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='digital'),jsonb_build_array(jsonb_build_object('order_item_id',(select id from public.order_items where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='digital') limit 1),'prepared_quantity',800)),'44444444-4444-4444-8444-000000000033')$$,'weighted replacement finalization');

insert into commerce_tap_output select is((select amount_cents from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='digital') and transaction_type='refund'),279::bigint,'refund matches exact final difference');

insert into commerce_tap_output select throws_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='digital'),'ready_for_pickup','44444444-4444-4444-8444-000000000034')$$,'P0001',NULL,'unsettled refund prevents fulfillment');

insert into commerce_tap_output select lives_ok($$select public.settle_manual_difference('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select id from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='digital') and transaction_type='refund'),'TEST-REFUND-VERIFIED','44444444-4444-4444-8444-000000000035')$$,'staff verifies outgoing refund');

insert into commerce_tap_output select lives_ok($$select public.settle_manual_difference('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select id from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='digital') and transaction_type='refund'),'TEST-REFUND-VERIFIED','44444444-4444-4444-8444-000000000035')$$,'refund settlement retry');

insert into commerce_tap_output select is((select payment_status from public.orders where id=(select (value->>'order_id')::uuid from cogana_test_results where key='digital')),'paid'::text,'net payment equal to final total remains paid after partial refund');

insert into commerce_tap_output select lives_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='digital'),'ready_for_pickup','44444444-4444-4444-8444-000000000036')$$,'advance digital to ready_for_pickup');

insert into commerce_tap_output select throws_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='digital'),'completed','44444444-4444-4444-8444-000000000037')$$,'P0001',NULL,'generic completion cannot bypass handover code');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);

insert into cogana_test_results select 'pickup_code',public.get_customer_order_details((select (value->>'order_id')::uuid from cogana_test_results where key='digital'));

insert into commerce_tap_output select ok((select value->>'confirmation_code' from cogana_test_results where key='pickup_code') ~ '^[A-F0-9]{8}$','ready customer can recover pickup code');

insert into commerce_tap_output select is(public.get_customer_order_details((select (value->>'order_id')::uuid from cogana_test_results where key='digital'))->>'confirmation_code',(select value->>'confirmation_code' from cogana_test_results where key='pickup_code'),'handover code stable across reload');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select lives_ok($$select public.complete_pickup('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='digital'),(select value->>'confirmation_code' from cogana_test_results where key='pickup_code'),'44444444-4444-4444-8444-000000000038')$$,'paid replacement order completes by code');

insert into public.delivery_zones(id,store_id,name,district,fee_cents,minimum_order_cents) values('44444444-4444-4444-8444-000000000002','03c25d8b-847f-4021-86bb-22d1955bbe6e','TEST Zone','Santa Anita',100,0);

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);

insert into cogana_test_results select 'delivery',public.submit_customer_order(jsonb_build_object('store_id','03c25d8b-847f-4021-86bb-22d1955bbe6e','source','android','fulfillment_type','delivery','payment_method','yape','scheduled_for',(((statement_timestamp() at time zone 'America/Lima')::date+2)+time '08:00') at time zone 'America/Lima','customer',jsonb_build_object('name','TEST Buyer','phone','999000000'),'delivery_zone_id','44444444-4444-4444-8444-000000000002'::uuid,'delivery_address','{"district":"Santa Anita","address":"TEST Address"}'::jsonb,'items',jsonb_build_array(jsonb_build_object('presentation_id','33333333-3333-4333-8333-333333333336','request_mode','presentation','requested_quantity',1))),'44444444-4444-4444-8444-000000000039');

insert into commerce_tap_output select lives_ok($$select public.report_customer_payment((select (value->>'order_id')::uuid from cogana_test_results where key='delivery'),'TEST-DELIVERY-REFERENCE')$$,'customer reports delivery payment');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select lives_ok($$select public.confirm_manual_payment('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='delivery'),(select id from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='delivery') and transaction_type='charge' limit 1),'44444444-4444-4444-8444-000000000040','TEST-VERIFIED-delivery')$$,'verified manual payment delivery');

insert into commerce_tap_output select lives_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='delivery'),'confirmed','44444444-4444-4444-8444-000000000041')$$,'advance delivery to confirmed');

insert into commerce_tap_output select lives_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='delivery'),'preparing','44444444-4444-4444-8444-000000000042')$$,'advance delivery to preparing');

insert into commerce_tap_output select lives_ok($$select public.finalize_weighted_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='delivery'),jsonb_build_array(jsonb_build_object('order_item_id',(select id from public.order_items where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='delivery') limit 1),'prepared_quantity',1000)),'44444444-4444-4444-8444-000000000043')$$,'sealed delivery stock consumed');

insert into commerce_tap_output select lives_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='delivery'),'ready_for_delivery','44444444-4444-4444-8444-000000000044')$$,'advance delivery to ready_for_delivery');

insert into commerce_tap_output select throws_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='delivery'),'out_for_delivery','44444444-4444-4444-8444-000000000045')$$,'P0001',NULL,'delivery cannot start without assignment');

insert into cogana_test_results select 'assignment',public.assign_delivery('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='delivery'),'33333333-3333-4333-8333-333333333331','44444444-4444-4444-8444-000000000046');

insert into commerce_tap_output select lives_ok($$select public.assign_delivery('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='delivery'),'33333333-3333-4333-8333-333333333331','44444444-4444-4444-8444-000000000046')$$,'assignment retry');

insert into commerce_tap_output select is((select count(*)::integer from public.delivery_assignments where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='delivery')),1,'assignment retries preserve one delivery');

insert into commerce_tap_output select is((select value->>'confirmation_code' from cogana_test_results where key='assignment'),NULL::text,'assignment response does not expose customer code to staff');

insert into commerce_tap_output select lives_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='delivery'),'out_for_delivery','44444444-4444-4444-8444-000000000047')$$,'advance delivery to out_for_delivery');

insert into commerce_tap_output select throws_ok($$select public.complete_delivery('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'assignment_id')::uuid from cogana_test_results where key='assignment'),'','fake/evidence.jpg','TEST Recipient','44444444-4444-4444-8444-000000000048')$$,'22023',NULL,'unverified evidence path cannot bypass customer code');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);

insert into cogana_test_results select 'delivery_code',public.get_customer_order_details((select (value->>'order_id')::uuid from cogana_test_results where key='delivery'));

select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-000000000001',true),set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-000000000001","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select throws_ok($$select public.complete_delivery('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'assignment_id')::uuid from cogana_test_results where key='assignment'),(select value->>'confirmation_code' from cogana_test_results where key='delivery_code'),'','','44444444-4444-4444-8444-000000000049')$$,'42501',NULL,'non-team account cannot complete delivery even with code');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select lives_ok($$select public.complete_delivery('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'assignment_id')::uuid from cogana_test_results where key='assignment'),(select value->>'confirmation_code' from cogana_test_results where key='delivery_code'),'','TEST Recipient','44444444-4444-4444-8444-000000000050')$$,'owner delivery completes using customer code');

insert into commerce_tap_output select lives_ok($$select public.complete_delivery('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'assignment_id')::uuid from cogana_test_results where key='assignment'),(select value->>'confirmation_code' from cogana_test_results where key='delivery_code'),'','TEST Recipient','44444444-4444-4444-8444-000000000050')$$,'completed delivery retry');

insert into commerce_tap_output select is((select status from public.orders where id=(select (value->>'order_id')::uuid from cogana_test_results where key='delivery')),'completed'::text,'full delivery reaches completed');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select is(public.get_customer_order_details((select (value->>'order_id')::uuid from cogana_test_results where key='delivery'))->>'confirmation_code',NULL::text,'completed delivery hides code');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select lives_ok($$select public.receive_inventory_lot('03c25d8b-847f-4021-86bb-22d1955bbe6e','33333333-3333-4333-8333-333333333334','TEST-ADJUSTMENT-STOCK',current_date+30,null,1500,null,null,'44444444-4444-4444-8444-000000000051')$$,'additional loose fixture for higher-priced replacement');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);

insert into cogana_test_results select 'adjustment',public.submit_customer_order(jsonb_build_object('store_id','03c25d8b-847f-4021-86bb-22d1955bbe6e','source','android','fulfillment_type','pickup','payment_method','yape','scheduled_for',(((statement_timestamp() at time zone 'America/Lima')::date+2)+time '08:00') at time zone 'America/Lima','customer',jsonb_build_object('name','TEST Buyer','phone','999000000'),'delivery_zone_id',null,'delivery_address',null,'items',jsonb_build_array(jsonb_build_object('presentation_id','33333333-3333-4333-8333-333333333336','request_mode','presentation','requested_quantity',1))),'44444444-4444-4444-8444-000000000052');

insert into commerce_tap_output select lives_ok($$select public.report_customer_payment((select (value->>'order_id')::uuid from cogana_test_results where key='adjustment'),'TEST-INITIAL-ADJUSTMENT')$$,'report initial payment before higher-priced replacement');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select lives_ok($$select public.confirm_manual_payment('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment'),(select id from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment') and transaction_type='charge' limit 1),'44444444-4444-4444-8444-000000000053','TEST-VERIFIED-adjustment')$$,'verified manual payment adjustment');

insert into commerce_tap_output select lives_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment'),'confirmed','44444444-4444-4444-8444-000000000054')$$,'advance adjustment to confirmed');

insert into commerce_tap_output select lives_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment'),'preparing','44444444-4444-4444-8444-000000000055')$$,'advance adjustment to preparing');

update public.order_items set substitution_policy='contact' where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment');

insert into cogana_test_results select 'higher_proposal',public.propose_substitution('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment'),(select id from public.order_items where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment') limit 1),'33333333-3333-4333-8333-333333333335',1000,now()+interval '30 minutes','44444444-4444-4444-8444-000000000056');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select lives_ok($$select public.decide_substitution('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'substitution_id')::uuid from cogana_test_results where key='higher_proposal'),'accepted','44444444-4444-4444-8444-000000000057')$$,'customer explicitly accepts more expensive replacement');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select lives_ok($$select public.finalize_weighted_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment'),jsonb_build_array(jsonb_build_object('order_item_id',(select id from public.order_items where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment') limit 1),'prepared_quantity',1000)),'44444444-4444-4444-8444-000000000058')$$,'higher replacement generates adjustment');

insert into commerce_tap_output select is((select amount_cents from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment') and transaction_type='adjustment'),101::bigint,'adjustment reflects exact additional amount');

insert into commerce_tap_output select is((select status from public.orders where id=(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment')),'awaiting_adjustment'::text,'higher total waits for additional payment');

select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-000000000001',true),set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-000000000001","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select throws_ok($$select public.report_customer_adjustment((select id from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment') and transaction_type='adjustment'),'TEST-ADJUSTMENT-REFERENCE')$$,'42501',NULL,'other account cannot report customer adjustment');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select lives_ok($$select public.report_customer_adjustment((select id from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment') and transaction_type='adjustment'),'TEST-ADJUSTMENT-REFERENCE')$$,'customer reports additional payment');

insert into commerce_tap_output select lives_ok($$select public.report_customer_adjustment((select id from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment') and transaction_type='adjustment'),'TEST-ADJUSTMENT-REFERENCE')$$,'same adjustment reference retry');

insert into commerce_tap_output select is((select status from public.payment_transactions where id=(select id from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment') and transaction_type='adjustment')),'processing'::text,'adjustment reference enters manual review');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select lives_ok($$select public.settle_manual_difference('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select id from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment') and transaction_type='adjustment'),'TEST-ADJUSTMENT-VERIFIED','44444444-4444-4444-8444-000000000059')$$,'staff verifies incoming additional payment');

insert into commerce_tap_output select is((select status from public.orders where id=(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment')),'preparing'::text,'settled adjustment restores preparation state');

insert into commerce_tap_output select lives_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='adjustment'),'ready_for_pickup','44444444-4444-4444-8444-000000000060')$$,'advance adjustment to ready_for_pickup');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);

insert into cogana_test_results select 'paid_cancel',public.submit_customer_order(jsonb_build_object('store_id','03c25d8b-847f-4021-86bb-22d1955bbe6e','source','android','fulfillment_type','pickup','payment_method','yape','scheduled_for',(((statement_timestamp() at time zone 'America/Lima')::date+2)+time '08:00') at time zone 'America/Lima','customer',jsonb_build_object('name','TEST Buyer','phone','999000000'),'delivery_zone_id',null,'delivery_address',null,'items',jsonb_build_array(jsonb_build_object('presentation_id','33333333-3333-4333-8333-333333333336','request_mode','presentation','requested_quantity',1))),'44444444-4444-4444-8444-000000000061');

insert into commerce_tap_output select lives_ok($$select public.report_customer_payment((select (value->>'order_id')::uuid from cogana_test_results where key='paid_cancel'),'TEST-PAID-CANCEL')$$,'report payment before paid cancellation');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true),set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',true);

insert into commerce_tap_output select lives_ok($$select public.confirm_manual_payment('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='paid_cancel'),(select id from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='paid_cancel') and transaction_type='charge' limit 1),'44444444-4444-4444-8444-000000000062','TEST-VERIFIED-paid_cancel')$$,'verified manual payment paid_cancel');

insert into commerce_tap_output select lives_ok($$select public.transition_order('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select (value->>'order_id')::uuid from cogana_test_results where key='paid_cancel'),'cancelled','44444444-4444-4444-8444-000000000063','TEST customer requested')$$,'staff cancels paid order with refund obligation');

insert into commerce_tap_output select is((select amount_cents from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='paid_cancel') and transaction_type='refund'),300::bigint,'paid cancellation creates full refund');

insert into commerce_tap_output select is((select status from public.inventory_reservations where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='paid_cancel')),'released'::text,'paid unprepared cancellation releases reservation');

insert into commerce_tap_output select lives_ok($$select public.settle_manual_difference('03c25d8b-847f-4021-86bb-22d1955bbe6e',(select id from public.payment_transactions where order_id=(select (value->>'order_id')::uuid from cogana_test_results where key='paid_cancel') and transaction_type='refund'),'TEST-FULL-REFUND','44444444-4444-4444-8444-000000000064')$$,'staff verifies cancelled order refund');

insert into commerce_tap_output select is((select payment_status from public.orders where id=(select (value->>'order_id')::uuid from cogana_test_results where key='paid_cancel')),'refunded'::text,'cancelled order reaches refunded payment state');

insert into commerce_tap_output select * from finish();
select jsonb_agg(line) results from commerce_tap_output;
rollback;
