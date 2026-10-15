begin;

-- A slot is consumed by its order, never by viewing/selecting a time in the app.
-- Cancellation (including the existing expiry worker) releases that capacity.
create index orders_slot_capacity_idx on public.orders(store_id,fulfillment_type,scheduled_for)
where status <> 'cancelled';

create function private.fulfillment_slot_windows(p_store_id uuid,p_mode text,p_from date,p_days integer)
returns table(starts_at timestamptz,ends_at timestamptz,capacity integer)
language sql stable security definer set search_path='' as $$
  with config as (
    select s.id,s.timezone,r.slot_minutes,r.minimum_notice_minutes,
      r.max_orders_per_slot * case when p_mode='delivery' then r.delivery_staff_count else 1 end as capacity
    from public.stores s
    join public.store_settings ss on ss.store_id=s.id
    join public.store_operational_state os on os.store_id=s.id
    join public.store_fulfillment_rules r on r.store_id=s.id and r.fulfillment_type=p_mode
    where s.id=p_store_id and s.status='active' and os.status='accepting_orders'
      and ((p_mode='pickup' and ss.accepts_pickup) or (p_mode='delivery' and ss.accepts_delivery))
  ), days as (
    select c.*,p_from+i as local_date from config c
    cross join generate_series(0,least(greatest(p_days,0),14)-1) i
  ), hours as (
    select d.*,
      case when e.local_date is not null then e.opens_at else h.opens_at end as opens,
      case when e.local_date is not null then e.closes_at else h.closes_at end as closes,
      case when e.local_date is not null then e.is_closed else h.is_closed end as closed
    from days d
    left join public.store_business_hours h on h.store_id=d.id and h.weekday=extract(isodow from d.local_date)
    left join public.store_schedule_exceptions e on e.store_id=d.id and e.local_date=d.local_date
  )
  select g.t, g.t+make_interval(mins=>h.slot_minutes),h.capacity
  from hours h
  cross join lateral generate_series(
    (h.local_date+h.opens) at time zone h.timezone,
    (h.local_date+h.closes) at time zone h.timezone - make_interval(mins=>h.slot_minutes),
    make_interval(mins=>h.slot_minutes)
  ) g(t)
  where h.closed=false and h.capacity>0
    and g.t >= statement_timestamp()+make_interval(mins=>h.minimum_notice_minutes)
    and g.t > statement_timestamp();
$$;
revoke all on function private.fulfillment_slot_windows(uuid,text,date,integer) from public,anon,authenticated;

create function private.get_checkout_slots(p_store_slug text,p_mode text,p_days integer default 7)
returns table(starts_at timestamptz,ends_at timestamptz,available boolean)
language plpgsql stable security definer set search_path='' as $$
declare sid uuid; tz text;
begin
  if p_mode is null or p_mode not in ('pickup','delivery') or p_days is null or p_days not between 1 and 14 then
    raise exception using errcode='22023',message='Modalidad o rango de días inválido';
  end if;
  select id,timezone into sid,tz from public.stores where slug=p_store_slug and status='active';
  if not found then return; end if;
  return query
    select w.starts_at,w.ends_at,
      (select count(*) from public.orders o where o.store_id=sid and o.fulfillment_type=p_mode
        and o.scheduled_for=w.starts_at and o.status<>'cancelled') < w.capacity
    from private.fulfillment_slot_windows(sid,p_mode,(statement_timestamp() at time zone tz)::date,p_days) w
    order by w.starts_at;
end; $$;
revoke all on function private.get_checkout_slots(text,text,integer) from public;
grant execute on function private.get_checkout_slots(text,text,integer) to anon,authenticated;

-- SQL-standard body resolves the private function at creation, so anonymous
-- visitors need no USAGE on private and gain access only to this safe result.
create function public.get_checkout_slots(p_store_slug text,p_mode text,p_days integer default 7)
returns table(starts_at timestamptz,ends_at timestamptz,available boolean)
language sql stable security invoker set search_path=''
begin atomic
  select * from private.get_checkout_slots(p_store_slug,p_mode,p_days);
end;
revoke all on function public.get_checkout_slots(text,text,integer) from public;
grant execute on function public.get_checkout_slots(text,text,integer) to anon,authenticated;

create or replace function private.validate_order_schedule_trigger()
returns trigger language plpgsql security definer set search_path='' as $$
declare tz text; cap integer; used bigint;
begin
  if new.status='cancelled' then return new; end if;
  -- Normal fulfillment/payment updates must not reapply lead time or require
  -- an open store. Only new demand, rescheduling and reactivation need a slot.
  if tg_op='UPDATE' then
    if old.status<>'cancelled' and
      (old.store_id,old.fulfillment_type,old.scheduled_for) is not distinct from
      (new.store_id,new.fulfillment_type,new.scheduled_for) then return new; end if;
  end if;
  if new.scheduled_for is null then
    raise exception using errcode='22023',message='Elige una franja de atención';
  end if;
  -- Lock ordering: store/settings/state before capacity. Rules and weekly-hour
  -- writers already lock the store exclusively, preventing stale configuration.
  select s.timezone into tz from public.stores s
    join public.store_settings ss on ss.store_id=s.id
    join public.store_operational_state os on os.store_id=s.id
    where s.id=new.store_id for share of s,ss,os;
  if not found then raise exception 'Tienda no disponible'; end if;
  if (new.scheduled_for at time zone tz)::date not between
    (statement_timestamp() at time zone tz)::date and (statement_timestamp() at time zone tz)::date+13 then
    raise exception using errcode='22023',message='El horario está fuera del rango de 14 días';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'fulfillment-capacity:'||new.store_id::text||':'||new.fulfillment_type,0));
  -- Volatile trigger queries take fresh snapshots after waiting for the lock.
  select w.capacity into cap from private.fulfillment_slot_windows(
    new.store_id,new.fulfillment_type,(new.scheduled_for at time zone tz)::date,1) w
    where w.starts_at=new.scheduled_for;
  if cap is null then raise exception using errcode='P0001',
    message='La franja ya no está disponible. Elige otro horario.'; end if;
  select count(*) into used from public.orders o where o.store_id=new.store_id
    and o.fulfillment_type=new.fulfillment_type and o.scheduled_for=new.scheduled_for
    and o.status<>'cancelled' and o.id<>new.id;
  if used>=cap then raise exception using errcode='P0001',
    message='La franja se llenó. Elige otro horario.'; end if;
  return new;
end; $$;
drop trigger validate_order_schedule_before_write on public.orders;
create trigger validate_order_schedule_before_write
before insert or update of store_id,fulfillment_type,scheduled_for,status on public.orders
for each row execute function private.validate_order_schedule_trigger();
revoke all on function private.validate_order_schedule_trigger() from public,anon,authenticated;

comment on function public.get_checkout_slots(text,text,integer) is
 'Public availability only; no staff identities, counts or order details. Selection does not reserve capacity.';
commit;
