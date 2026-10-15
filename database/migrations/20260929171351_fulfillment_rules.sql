begin;

create table public.store_fulfillment_rules (
  store_id uuid not null references public.stores(id) on delete cascade,
  fulfillment_type text not null check (fulfillment_type in ('pickup','delivery')),
  slot_minutes integer not null check (slot_minutes between 1 and 1440),
  max_orders_per_slot integer not null check (max_orders_per_slot between 1 and 1000),
  minimum_notice_minutes integer not null check (minimum_notice_minutes between 0 and 10080),
  capacity_basis text not null check (capacity_basis in ('store','driver')),
  updated_at timestamptz not null default now(),
  primary key (store_id, fulfillment_type),
  check ((fulfillment_type='pickup' and capacity_basis='store') or
         (fulfillment_type='delivery' and capacity_basis='driver'))
);
alter table public.store_fulfillment_rules enable row level security;
grant select on public.store_fulfillment_rules to authenticated;
revoke insert,update,delete on public.store_fulfillment_rules from anon,authenticated;
create policy fulfillment_rules_admin_select on public.store_fulfillment_rules
for select to authenticated using (
  (select private.has_store_role(store_id, array['owner','admin']))
);

create function private.set_fulfillment_rules(
  p_store_id uuid, p_mode text, p_slot_minutes integer,
  p_max_orders integer, p_notice_minutes integer
) returns void language plpgsql security definer set search_path='' as $$
begin
  if p_store_id is null or not private.has_store_role(p_store_id,array['owner','admin']) then
    raise exception using errcode='42501',message='No tienes permiso para editar esta tienda';
  end if;
  if p_mode is null or p_mode not in ('pickup','delivery') or
     p_slot_minutes is null or p_slot_minutes not between 1 and 1440 or
     p_max_orders is null or p_max_orders not between 1 and 1000 or
     p_notice_minutes is null or p_notice_minutes not between 0 and 10080 then
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
    (store_id,fulfillment_type,slot_minutes,max_orders_per_slot,minimum_notice_minutes,capacity_basis)
  values (p_store_id,p_mode,p_slot_minutes,p_max_orders,p_notice_minutes,
    case p_mode when 'delivery' then 'driver' else 'store' end)
  on conflict (store_id,fulfillment_type) do update set
    slot_minutes=excluded.slot_minutes,max_orders_per_slot=excluded.max_orders_per_slot,
    minimum_notice_minutes=excluded.minimum_notice_minutes,updated_at=statement_timestamp()
  where (store_fulfillment_rules.slot_minutes,store_fulfillment_rules.max_orders_per_slot,
    store_fulfillment_rules.minimum_notice_minutes) is distinct from
    (excluded.slot_minutes,excluded.max_orders_per_slot,excluded.minimum_notice_minutes);
end;
$$;
create function public.set_fulfillment_rules(
  p_store_id uuid,p_mode text,p_slot_minutes integer,p_max_orders integer,p_notice_minutes integer
) returns void language sql security invoker set search_path='' as $$
  select private.set_fulfillment_rules($1,$2,$3,$4,$5);
$$;
revoke all on function private.set_fulfillment_rules(uuid,text,integer,integer,integer) from public,anon;
revoke all on function public.set_fulfillment_rules(uuid,text,integer,integer,integer) from public,anon;
grant execute on function private.set_fulfillment_rules(uuid,text,integer,integer,integer) to authenticated;
grant execute on function public.set_fulfillment_rules(uuid,text,integer,integer,integer) to authenticated;
comment on table public.store_fulfillment_rules is
 'Reglas por modalidad. Delivery expresa cupo por repartidor disponible; no publica ni reserva franjas por sí sola.';
commit;
