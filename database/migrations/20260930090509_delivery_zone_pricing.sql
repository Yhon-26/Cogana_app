begin;
-- No ETA was supplied: a delivery slot is not a transit-time estimate.
alter table public.delivery_zones alter column eta_min_minutes drop not null,
  alter column eta_max_minutes drop not null;
alter table public.delivery_zones add constraint delivery_zones_eta_pair
  check ((eta_min_minutes is null) = (eta_max_minutes is null));
do $$
declare store_uuid uuid;
begin
  select id into strict store_uuid from public.stores where slug='cogana-santa-anita';
  insert into public.delivery_zones(store_id,name,district,fee_cents,minimum_order_cents,restrictions)
  values
    (store_uuid,'Zona 1 · Los Ficus y Universal','Santa Anita',400,3000,'Solo Los Ficus y Universal.'),
    (store_uuid,'Zona 2 · Resto de Santa Anita','Santa Anita',600,4000,'Santa Anita, excepto Los Ficus y Universal.');
end $$;
-- Safe public projection; no addresses, staff or internal data are exposed.
create function private.get_customer_delivery_zones(p_store_slug text)
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',z.id,'name',z.name,
    'district',z.district,'fee_cents',z.fee_cents,
    'minimum_order_cents',z.minimum_order_cents,'restrictions',z.restrictions)
    order by z.name,z.id),'[]'::jsonb)
  from public.delivery_zones z join public.stores s on s.id=z.store_id
  where s.slug=p_store_slug and s.status='active' and z.is_active;
$$;
revoke all on function private.get_customer_delivery_zones(text) from public;
grant execute on function private.get_customer_delivery_zones(text) to anon,authenticated;
create function public.get_customer_delivery_zones(p_store_slug text)
returns jsonb language sql stable security invoker set search_path=''
begin atomic
  select private.get_customer_delivery_zones(p_store_slug);
end;
revoke all on function public.get_customer_delivery_zones(text) from public;
grant execute on function public.get_customer_delivery_zones(text) to anon,authenticated;
commit;
