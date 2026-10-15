-- Integration regression for the configured Cogana store. All writes roll back.
begin;
select set_config('request.jwt.claims',json_build_object('sub',m.user_id,'role','authenticated','is_anonymous',false)::text,true) from public.store_memberships m join public.stores s on s.id=m.store_id where s.slug='cogana-santa-anita' and m.role='owner' and m.is_active limit 1; set local role authenticated;
do $test$
declare sid uuid := (select id from public.stores where slug='cogana-santa-anita'); n integer;
begin
 perform public.set_fulfillment_rules(sid,'delivery',60,4,90,3);
 select max_orders_per_slot*delivery_staff_count into n from public.store_fulfillment_rules where store_id=sid and fulfillment_type='delivery';
 if n<>12 then raise exception 'Expected capacity 12'; end if;
 perform public.set_fulfillment_rules(sid,'delivery',60,4,90);
 select delivery_staff_count into n from public.store_fulfillment_rules where store_id=sid and fulfillment_type='delivery';
 if n<>3 then raise exception 'Old client reset count'; end if;
 perform public.set_fulfillment_rules(sid,'delivery',60,4,90,0);
 select delivery_staff_count into n from public.store_fulfillment_rules where store_id=sid and fulfillment_type='delivery';
 if n<>0 then raise exception 'Zero failed'; end if;
 begin
  perform public.set_fulfillment_rules(sid,'delivery',60,4,90,-1);
  raise exception 'Negative accepted';
 exception when invalid_parameter_value then null;
 end;
 begin
  perform public.set_fulfillment_rules(sid,'pickup',30,8,45,2);
  raise exception 'Pickup accepted staff';
 exception when invalid_parameter_value then null;
 end;
 perform set_config('request.jwt.claims','{}',true);
 begin
  perform public.set_fulfillment_rules(sid,'delivery',60,4,90,2);
  raise exception 'Unauthorized accepted';
 exception when insufficient_privilege then null;
 end;
end $test$;
rollback;
select '6 capacity and access checks passed; changes rolled back' as result;
