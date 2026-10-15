begin;
-- Planning capacity, not account roles. Owners may deliver without losing owner access.
-- Delivery follows store weekly hours and exceptions; do not duplicate schedules.
alter table public.store_fulfillment_rules add column delivery_staff_count integer;
update public.store_fulfillment_rules set delivery_staff_count=0 where fulfillment_type='delivery';
alter table public.store_fulfillment_rules add constraint delivery_staff_count_valid check (
  (fulfillment_type='pickup' and delivery_staff_count is null) or
  (fulfillment_type='delivery' and delivery_staff_count is not null and delivery_staff_count between 0 and 100)
);
comment on column public.store_fulfillment_rules.delivery_staff_count is
 'People planned available throughout store hours, including owner. Zero disables planned delivery capacity. Not Auth roles or per-order assignments.';
drop function public.set_fulfillment_rules(uuid,text,integer,integer,integer);
drop function private.set_fulfillment_rules(uuid,text,integer,integer,integer);
create function private.set_fulfillment_rules(
  p_store_id uuid, p_mode text, p_slot_minutes integer,
  p_max_orders integer, p_notice_minutes integer, p_delivery_staff_count integer default null
) returns void language plpgsql security definer set search_path='' as $$
begin
  if p_store_id is null or not private.has_store_role(p_store_id,array['owner','admin']) then
    raise exception using errcode='42501',message='No tienes permiso para editar esta tienda';
  end if;
  if p_mode is null or p_mode not in ('pickup','delivery') or
     p_slot_minutes is null or p_slot_minutes not between 1 and 1440 or
     p_max_orders is null or p_max_orders not between 1 and 1000 or
     p_notice_minutes is null or p_notice_minutes not between 0 and 10080 or
     (p_delivery_staff_count is not null and (p_mode <> 'delivery' or p_delivery_staff_count not between 0 and 100)) then
    raise exception using errcode='22023',message='Revisa la duración, el cupo y la anticipación';
  end if;
  perform 1 from public.stores where id=p_store_id and status='active' for update;
  if not found then raise exception 'Tienda no disponible'; end if;
  if exists (select 1 from public.orders where store_id=p_store_id
    and fulfillment_type=p_mode and scheduled_for>statement_timestamp()
    and status not in ('completed','cancelled')) then
    raise exception 'Hay pedidos futuros de esta modalidad. Revisa sus compromisos antes de cambiar las reglas.';
  end if;
  insert into public.store_fulfillment_rules
    (store_id,fulfillment_type,slot_minutes,max_orders_per_slot,minimum_notice_minutes,capacity_basis,delivery_staff_count)
  values (p_store_id,p_mode,p_slot_minutes,p_max_orders,p_notice_minutes,
    case p_mode when 'delivery' then 'driver' else 'store' end,
    case when p_mode='delivery' then coalesce(p_delivery_staff_count,0) end)
  on conflict (store_id,fulfillment_type) do update set
    slot_minutes=excluded.slot_minutes,max_orders_per_slot=excluded.max_orders_per_slot,
    minimum_notice_minutes=excluded.minimum_notice_minutes,
    delivery_staff_count=case when p_mode='delivery' then coalesce(p_delivery_staff_count,store_fulfillment_rules.delivery_staff_count) end,
    updated_at=statement_timestamp()
  where (store_fulfillment_rules.slot_minutes,store_fulfillment_rules.max_orders_per_slot,
    store_fulfillment_rules.minimum_notice_minutes,store_fulfillment_rules.delivery_staff_count) is distinct from
    (excluded.slot_minutes,excluded.max_orders_per_slot,excluded.minimum_notice_minutes,
     case when p_mode='delivery' then coalesce(p_delivery_staff_count,store_fulfillment_rules.delivery_staff_count) end);
end;
$$;
create function public.set_fulfillment_rules(
  p_store_id uuid,p_mode text,p_slot_minutes integer,p_max_orders integer,p_notice_minutes integer, p_delivery_staff_count integer default null
) returns void language sql security invoker set search_path='' as $$
  select private.set_fulfillment_rules($1,$2,$3,$4,$5,$6);
$$;
revoke all on function private.set_fulfillment_rules(uuid,text,integer,integer,integer,integer) from public,anon;
revoke all on function public.set_fulfillment_rules(uuid,text,integer,integer,integer,integer) from public,anon;
grant execute on function private.set_fulfillment_rules(uuid,text,integer,integer,integer,integer) to authenticated;
grant execute on function public.set_fulfillment_rules(uuid,text,integer,integer,integer,integer) to authenticated;
commit;
