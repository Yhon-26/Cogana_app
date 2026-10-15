begin;

-- These fields are public storefront information. Keep customer-visible reads
-- column-scoped; staff continue to use their existing broader SELECT grants.
grant select (id, slug, timezone, status) on public.stores to anon;
grant select (store_id, weekday, opens_at, closes_at, is_closed)
  on public.store_business_hours to anon;
grant select (store_id, local_date, opens_at, closes_at, is_closed, public_message)
  on public.store_schedule_exceptions to anon;
grant select (store_id, status, public_message)
  on public.store_operational_state to anon;

create policy stores_public_active_select on public.stores
for select to anon
using (status = 'active');

create policy hours_public_active_select on public.store_business_hours
for select to anon
using (exists (
  select 1 from public.stores s
  where s.id = store_id and s.status = 'active'
));

create policy exceptions_public_active_select on public.store_schedule_exceptions
for select to anon
using (exists (
  select 1 from public.stores s
  where s.id = store_id and s.status = 'active'
));

create policy operation_public_active_select on public.store_operational_state
for select to anon
using (exists (
  select 1 from public.stores s
  where s.id = store_id and s.status = 'active'
));

commit;
