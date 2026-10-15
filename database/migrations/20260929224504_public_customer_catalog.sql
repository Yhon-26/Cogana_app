begin;
-- Public projection only. Inventory lots, supplier costs and reservation owners
-- stay private. Available quantities mirror reserve_inventory_fefo eligibility.
create function private.get_customer_catalog(p_store_slug text)
returns jsonb language sql stable security definer set search_path='' as $$
with store as (
  select id,timezone from public.stores where slug=p_store_slug and status='active'
), allocated as (
  select a.lot_id,a.package_presentation_id,
    sum(a.allocated_base_quantity) as base_qty,sum(a.allocated_package_units) as packages
  from public.inventory_reservation_allocations a
  join public.inventory_reservations r on r.store_id=a.store_id and r.id=a.reservation_id
  join store s on s.id=a.store_id
  where r.status in ('reserved','partially_consumed') and r.expires_at>statement_timestamp()
  group by a.lot_id,a.package_presentation_id
), lots as (
  select l.* from public.inventory_lots l join store s on s.id=l.store_id
  where l.status='available' and (l.expires_on is null or l.expires_on >= (statement_timestamp() at time zone s.timezone)::date)
), loose as (
  select l.product_id,sum(greatest(l.loose_on_hand_quantity-coalesce(a.base_qty,0),0)) as qty
  from lots l left join allocated a on a.lot_id=l.id and a.package_presentation_id is null
  group by l.product_id
), sealed as (
  select lp.presentation_id,sum(greatest(lp.sealed_on_hand_units-coalesce(a.packages,0),0)) as qty
  from lots l join public.inventory_lot_packages lp on lp.lot_id=l.id and lp.store_id=l.store_id
  left join allocated a on a.lot_id=l.id and a.package_presentation_id=lp.presentation_id
  group by lp.presentation_id
)
select coalesce(jsonb_agg(jsonb_build_object(
  'id',pp.id,'product_id',p.id,'store_id',s.id,'product_sku',p.sku,'presentation_sku',pp.sku,
  'name',p.name,'presentation',pp.name,'description',coalesce(p.description,''),
  'category',coalesce(c.slug,'otros'),'category_name',coalesce(c.name,'Otros'),
  'price_cents',pp.price_cents,'base_quantity',pp.base_quantity,'base_unit',p.base_unit,
  'price_mode',pp.price_mode,'allows_quantity_input',pp.allows_quantity_input,
  'allows_money_input',pp.allows_money_input,'minimum_quantity',pp.minimum_quantity,
  'quantity_step',pp.quantity_step,'is_sealed',pp.is_sealed,
  'available_quantity',case when pp.is_sealed then coalesce(sealed.qty,0)*pp.base_quantity else coalesce(loose.qty,0) end,
  'image_path',(select i.storage_path from public.product_images i where i.store_id=s.id and i.product_id=p.id order by i.sort_order,i.id limit 1)
) order by p.name,pp.base_quantity,pp.id),'[]'::jsonb)
from store s join public.products p on p.store_id=s.id and p.is_active
join public.product_presentations pp on pp.store_id=s.id and pp.product_id=p.id and pp.is_active
left join public.categories c on c.store_id=s.id and c.id=p.category_id
left join loose on loose.product_id=p.id left join sealed on sealed.presentation_id=pp.id
where c.id is null or c.is_active;
$$;
revoke all on function private.get_customer_catalog(text) from public;
grant execute on function private.get_customer_catalog(text) to anon,authenticated;
create function public.get_customer_catalog(p_store_slug text)
returns jsonb language sql stable security invoker set search_path=''
begin atomic
  select private.get_customer_catalog(p_store_slug);
end;
revoke all on function public.get_customer_catalog(text) from public;
grant execute on function public.get_customer_catalog(text) to anon,authenticated;
commit;
