-- Safe regression checks. All temporary configuration changes roll back.
begin;
do $$
declare zones jsonb;
begin
  zones := public.get_customer_delivery_zones('cogana-santa-anita');
  if jsonb_array_length(zones) <> 2 then raise exception 'Expected two zones'; end if;
  if not zones @> '[{"fee_cents":400,"minimum_order_cents":3000},{"fee_cents":600,"minimum_order_cents":4000}]'::jsonb
    then raise exception 'Incorrect pricing'; end if;
  if public.get_customer_delivery_zones('missing-store') <> '[]'::jsonb
    then raise exception 'Unknown store exposed zones'; end if;
  update public.delivery_zones set is_active=false where store_id=(select id from public.stores where slug='cogana-santa-anita');
  if public.get_customer_delivery_zones('cogana-santa-anita') <> '[]'::jsonb
    then raise exception 'Inactive zones exposed'; end if;
  if has_schema_privilege('anon','private','usage') then raise exception 'Private schema exposed'; end if;
end $$;
set local role anon;
select public.get_customer_delivery_zones('cogana-santa-anita') = '[]'::jsonb as inactive_hidden_for_anon;
rollback;
