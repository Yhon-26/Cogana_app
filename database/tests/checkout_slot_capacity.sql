-- Isolated store and orders; all fixtures and mutations are rolled back.
begin;
create temp table slot_test_result(result text) on commit drop;
do $test$
declare
  org uuid := gen_random_uuid(); sid uuid := gen_random_uuid(); customer uuid := gen_random_uuid();
  zone uuid := gen_random_uuid(); oid uuid; first_order uuid; n integer; flag boolean;
  test_date date := (statement_timestamp() at time zone 'America/Lima')::date+2;
  start_time timestamptz; test_slug text := 'slot-test-'||replace(sid::text,'-','');
begin
  insert into public.organizations(id,name) values(org,'TEST Slots');
  insert into public.stores(id,organization_id,code,name,slug) values(sid,org,'TEST','TEST Slots',test_slug);
  insert into public.store_settings(store_id,display_name) values(sid,'TEST');
  insert into public.store_operational_state(store_id,status) values(sid,'accepting_orders');
  insert into public.store_business_hours(store_id,weekday,opens_at,closes_at)
    select sid,i,'07:00'::time,'20:00'::time from generate_series(1,7) i;
  insert into public.store_fulfillment_rules(store_id,fulfillment_type,slot_minutes,max_orders_per_slot,minimum_notice_minutes,capacity_basis,delivery_staff_count)
    values(sid,'pickup',30,8,45,'store',null),(sid,'delivery',60,4,90,'driver',2);
  insert into public.customers(id,store_id,name,phone) values(customer,sid,'TEST','000000000');
  insert into public.delivery_zones(id,store_id,name,district,fee_cents,eta_min_minutes,eta_max_minutes)
    values(zone,sid,'TEST','TEST',0,1,2);
  select count(*) into n from private.fulfillment_slot_windows(sid,'pickup',test_date,1);
  if n<>26 then raise exception 'Expected 26 pickup slots, got %',n; end if;
  select count(*) into n from private.fulfillment_slot_windows(sid,'delivery',test_date,1);
  if n<>13 then raise exception 'Expected 13 delivery slots, got %',n; end if;
  start_time := (test_date+'07:00'::time) at time zone 'America/Lima';
  -- Both modalities have independent capacity even at the same start time.
  for n in 1..8 loop
    oid:=gen_random_uuid(); if n=1 then first_order:=oid; end if;
    insert into public.orders(id,store_id,order_number,operation_id,customer_id,source,fulfillment_type,
      status,payment_method,customer_name,customer_phone,scheduled_for,estimated_subtotal_cents,estimated_total_cents)
      values(oid,sid,oid::text,gen_random_uuid(),customer,'android','pickup','queued','cash','TEST','000',start_time,0,0);
  end loop;
  select available into flag from public.get_checkout_slots(test_slug,'pickup',7) where starts_at=start_time;
  if flag is distinct from false then raise exception 'Full pickup reported available'; end if;
  select available into flag from public.get_checkout_slots(test_slug,'delivery',7) where starts_at=start_time;
  if flag is distinct from true then raise exception 'Pickup consumed delivery capacity'; end if;
  begin
    insert into public.orders(store_id,order_number,operation_id,customer_id,source,fulfillment_type,
      status,payment_method,customer_name,customer_phone,scheduled_for,estimated_subtotal_cents,estimated_total_cents)
      values(sid,'overflow',gen_random_uuid(),customer,'android','pickup','queued','cash','TEST','000',start_time,0,0);
    raise exception using errcode='XX000',message='Overbooking accepted';
  exception when raise_exception then
    if sqlerrm<>'La franja se llenó. Elige otro horario.' then raise; end if;
  end;
  update public.orders set status='completed' where id=first_order;
  select available into flag from public.get_checkout_slots(test_slug,'pickup',7) where starts_at=start_time;
  if flag is distinct from false then raise exception 'Completed order freed slot'; end if;
  update public.orders set status='cancelled' where id=first_order;
  select available into flag from public.get_checkout_slots(test_slug,'pickup',7) where starts_at=start_time;
  if flag is distinct from true then raise exception 'Cancellation failed to free slot'; end if;
  -- Reprogramming excludes the same order but validates alignment.
  begin
    update public.orders set scheduled_for=start_time+interval '1 minute',status='queued' where id=first_order;
    raise exception using errcode='XX000',message='Misaligned slot accepted';
  exception when raise_exception then null; end;
  begin
    update public.orders set scheduled_for=null,status='queued' where id=first_order;
    raise exception using errcode='XX000',message='Null slot accepted';
  exception when invalid_parameter_value then null; end;
  update public.store_fulfillment_rules set minimum_notice_minutes=10080 where store_id=sid and fulfillment_type='pickup';
  select count(*) into n from private.fulfillment_slot_windows(sid,'pickup',test_date,1);
  if n<>0 then raise exception 'Notice was ignored'; end if;
  update public.store_fulfillment_rules set minimum_notice_minutes=45 where store_id=sid and fulfillment_type='pickup';
  update public.store_fulfillment_rules set delivery_staff_count=0 where store_id=sid and fulfillment_type='delivery';
  select count(*) into n from private.fulfillment_slot_windows(sid,'delivery',test_date,1);
  if n<>0 then raise exception 'Zero staff published slots'; end if;
  update public.store_fulfillment_rules set delivery_staff_count=3 where store_id=sid and fulfillment_type='delivery';
  select capacity into n from private.fulfillment_slot_windows(sid,'delivery',test_date,1) limit 1;
  if n<>12 then raise exception 'Three staff should provide capacity 12'; end if;
  insert into public.store_schedule_exceptions(store_id,local_date,is_closed) values(sid,test_date,true);
  select count(*) into n from private.fulfillment_slot_windows(sid,'delivery',test_date,1);
  if n<>0 then raise exception 'Closed exception ignored'; end if;
  update public.store_schedule_exceptions set is_closed=false,opens_at='09:15',closes_at='11:45' where store_id=sid;
  select count(*) into n from private.fulfillment_slot_windows(sid,'delivery',test_date,1);
  if n<>2 then raise exception 'Partial final interval was published'; end if;
  update public.store_operational_state set status='closed' where store_id=sid;
  select count(*) into n from public.get_checkout_slots(test_slug,'delivery',7);
  if n<>0 then raise exception 'Closed store published slots'; end if;
  insert into slot_test_result values('Passed: duration, independent capacity, overflow, completed/cancelled orders, alignment, null, notice, staffing, exceptions, partial intervals, closed store');
end $test$;
select * from slot_test_result;
rollback;
