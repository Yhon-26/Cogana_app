begin;

-- A scheduled order must fall inside the store's local hours. The store row
-- lock coordinates this read with private.set_store_business_hours.
create function private.assert_checkout_schedule(
  p_store_id uuid,
  p_scheduled_for timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_timezone text;
  v_local timestamp without time zone;
  v_date date;
  v_time time without time zone;
  v_opens time without time zone;
  v_closes time without time zone;
  v_closed boolean;
begin
  if p_scheduled_for is null then
    return;
  end if;
  if p_scheduled_for <= statement_timestamp() then
    raise exception using errcode = '22023', message = 'El horario debe ser futuro';
  end if;

  select s.timezone into v_timezone
  from public.stores s
  where s.id = p_store_id and s.status = 'active'
  for share;
  if not found then
    raise exception using errcode = 'P0001', message = 'Tienda no disponible';
  end if;

  v_local := p_scheduled_for at time zone v_timezone;
  v_date := v_local::date;
  v_time := v_local::time;

  -- A dated exception overrides the weekly hours, including full closure.
  select e.is_closed, e.opens_at, e.closes_at
    into v_closed, v_opens, v_closes
  from public.store_schedule_exceptions e
  where e.store_id = p_store_id and e.local_date = v_date;

  if not found then
    select h.is_closed, h.opens_at, h.closes_at
      into v_closed, v_opens, v_closes
    from public.store_business_hours h
    where h.store_id = p_store_id
      and h.weekday = extract(isodow from v_local)::smallint;
  end if;

  if not found or v_closed or v_time < v_opens or v_time >= v_closes then
    raise exception using errcode = 'P0001',
      message = 'El horario elegido está fuera de la atención de la tienda';
  end if;
end;
$$;

create function private.validate_order_schedule_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_checkout_schedule(new.store_id, new.scheduled_for);
  return new;
end;
$$;

create trigger validate_order_schedule_before_write
before insert or update of store_id, scheduled_for on public.orders
for each row execute function private.validate_order_schedule_trigger();

-- Exception editing has no authorized app workflow yet. Prevent direct writes
-- from bypassing the shared store lock until its own transactional RPC exists.
revoke insert, update, delete on public.store_schedule_exceptions from authenticated;
revoke all on function private.assert_checkout_schedule(uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function private.validate_order_schedule_trigger()
  from public, anon, authenticated;

comment on function private.assert_checkout_schedule(uuid, timestamptz) is
  'Valida un instante futuro contra horario semanal o excepción local; no calcula capacidad de franja.';

commit;
