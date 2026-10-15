begin;
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
    '{}'::jsonb, '{}'::jsonb, now(), now(), false
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


update public.inventory_lots set loose_on_hand_quantity=10000 where lot_code in ('TEST-EARLY','TEST-LATE');
update public.store_operational_state set status='accepting_orders' where store_id='03c25d8b-847f-4021-86bb-22d1955bbe6e';
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true);
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);
do $test$
declare payload jsonb; result jsonb; replay jsonb; second_result jsonb; tx uuid; before_deadline timestamptz;
begin
  payload:=jsonb_build_object('store_id','03c25d8b-847f-4021-86bb-22d1955bbe6e','source','android',
    'scheduled_for',(((statement_timestamp() at time zone 'America/Lima')::date+2)+time '07:00') at time zone 'America/Lima',
    'fulfillment_type','delivery','payment_method','yape',
    'delivery_zone_id',(select id from public.delivery_zones where store_id='03c25d8b-847f-4021-86bb-22d1955bbe6e' and fee_cents=400 limit 1),
    'delivery_address',jsonb_build_object('district','Santa Anita','address','TEST address'),
    'customer',jsonb_build_object('name','TEST Buyer','phone','999000000'),
    'items',jsonb_build_array(jsonb_build_object('presentation_id','33333333-3333-4333-8333-333333333335','request_mode','money','requested_money_cents',3000)));
  execute 'set local role authenticated';
  result:=public.submit_customer_order(payload,'33333333-3333-4333-8333-333333333340');
  execute 'reset role';
  if (result->>'estimated_total_cents')::int<>3400 then raise exception 'Incorrect shipping total'; end if;
  begin
    perform public.submit_customer_order(jsonb_set(payload,'{items,0,requested_money_cents}','2999'::jsonb),'33333333-3333-4333-8333-333333333349');
    raise exception using errcode='XX000',message='Order below minimum accepted';
  exception when raise_exception then
    if position('mínimo' in sqlerrm)=0 then raise; end if;
  end;
  if (result->>'reservation_expires_at')::timestamptz<>statement_timestamp()+interval '15 minutes' then raise exception 'Wrong server deadline'; end if;
  replay:=public.create_checkout_order(payload,'33333333-3333-4333-8333-333333333340',now()+interval '99 days');
  if replay->>'order_id'<>result->>'order_id' or not (replay->>'idempotent_replay')::boolean then raise exception 'Idempotency failed'; end if;
  if replay->>'reservation_expires_at'<>result->>'reservation_expires_at' then raise exception 'Replay extended deadline'; end if;
  if has_function_privilege('authenticated','private.create_checkout_order(jsonb,uuid,timestamptz)','execute') then raise exception 'Legacy bypass available'; end if;
  perform set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true);
  begin
    perform public.report_customer_payment((result->>'order_id')::uuid,'TEST1234');
    raise exception 'Cross-account report accepted';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true);
  execute 'set local role authenticated';
  perform public.report_customer_payment((result->>'order_id')::uuid,'TEST1234');
  perform public.report_customer_payment((result->>'order_id')::uuid,'TEST1234');
  execute 'reset role';
  if (select payment_status from public.orders where id=(result->>'order_id')::uuid)<>'processing' then raise exception 'Report incorrectly marked paid'; end if;
  if exists(select 1 from public.inventory_reservations where order_id=(result->>'order_id')::uuid and expires_at<>'infinity'::timestamptz) then raise exception 'Review hold lost'; end if;
  select id into tx from public.payment_transactions where order_id=(result->>'order_id')::uuid;
  perform set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333331',true);
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333331","role":"authenticated","is_anonymous":false}',true);
  perform public.confirm_manual_payment('03c25d8b-847f-4021-86bb-22d1955bbe6e',(result->>'order_id')::uuid,tx,'33333333-3333-4333-8333-333333333345','TEST-VERIFIED-1234');
  if (select payment_status from public.orders where id=(result->>'order_id')::uuid)<>'paid' then raise exception 'Owner confirmation failed'; end if;
  perform set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333332',true);
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333332","role":"authenticated","is_anonymous":false}',true);
  second_result:=public.submit_customer_order(payload,'33333333-3333-4333-8333-333333333341');
  update public.orders set payment_due_at=statement_timestamp()-interval '1 second' where id=(second_result->>'order_id')::uuid;
  update public.inventory_reservations set expires_at=statement_timestamp()-interval '1 second' where order_id=(second_result->>'order_id')::uuid;
  begin
    perform public.report_customer_payment((second_result->>'order_id')::uuid,'TEST-LATE');
    raise exception using errcode='XX000',message='Late payment report accepted';
  exception when raise_exception then null; end;
  perform private.release_expired_reservations(1000);
  if (select status from public.orders where id=(second_result->>'order_id')::uuid)<>'cancelled' then raise exception 'Expired order not cancelled'; end if;
  if (select payment_status from public.orders where id=(result->>'order_id')::uuid)<>'paid' then raise exception 'Verified payment lost'; end if;
end $test$;
select 'Customer checkout, server deadline, delivery price, replay, ownership, manual review, confirmation and expiry passed' as result;
rollback;
