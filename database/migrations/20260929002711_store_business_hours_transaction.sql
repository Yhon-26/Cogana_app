begin;

-- Checkout already locks the same stores row FOR SHARE while creating an
-- order. This exclusive lock makes the future-order check and hours update
-- atomic with respect to scheduled checkout orders.
create function private.set_store_business_hours(
  p_store_id uuid,
  p_weekday smallint,
  p_is_closed boolean,
  p_opens_at time without time zone,
  p_closes_at time without time zone
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hours public.store_business_hours%rowtype;
begin
  if p_store_id is null or not private.has_store_role(p_store_id, array['owner', 'admin']) then
    raise exception using errcode = '42501', message = 'No tienes permiso para editar esta tienda';
  end if;
  if p_weekday is null or p_weekday not between 1 and 7 or p_is_closed is null then
    raise exception using errcode = '22023', message = 'Día u horario inválido';
  end if;
  if (p_is_closed and (p_opens_at is not null or p_closes_at is not null))
    or (not p_is_closed and
      (p_opens_at is null or p_closes_at is null or p_closes_at <= p_opens_at)) then
    raise exception using errcode = '22023', message = 'La hora de cierre debe ser posterior a la apertura';
  end if;

  perform 1 from public.stores s
  where s.id = p_store_id and s.status = 'active'
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'Tienda no disponible';
  end if;

  if exists (
    select 1 from public.orders o
    where o.store_id = p_store_id
      and o.scheduled_for > statement_timestamp()
      and o.status not in ('completed', 'cancelled')
  ) then
    raise exception using errcode = 'P0001',
      message = 'Hay pedidos futuros programados. Revisa sus compromisos antes de cambiar el horario.';
  end if;

  insert into public.store_business_hours (
    store_id, weekday, is_closed, opens_at, closes_at
  ) values (
    p_store_id, p_weekday, p_is_closed, p_opens_at, p_closes_at
  )
  on conflict (store_id, weekday) do update
    set is_closed = excluded.is_closed,
        opens_at = excluded.opens_at,
        closes_at = excluded.closes_at,
        updated_at = statement_timestamp()
    where (public.store_business_hours.is_closed,
           public.store_business_hours.opens_at,
           public.store_business_hours.closes_at)
      is distinct from (excluded.is_closed, excluded.opens_at, excluded.closes_at)
  returning * into v_hours;

  if not found then
    select * into v_hours from public.store_business_hours
    where store_id = p_store_id and weekday = p_weekday;
  end if;

  return pg_catalog.jsonb_build_object(
    'weekday', v_hours.weekday,
    'is_closed', v_hours.is_closed,
    'opens_at', v_hours.opens_at,
    'closes_at', v_hours.closes_at
  );
end;
$$;

create function public.set_store_business_hours(
  p_store_id uuid,
  p_weekday smallint,
  p_is_closed boolean,
  p_opens_at time without time zone,
  p_closes_at time without time zone
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.set_store_business_hours($1, $2, $3, $4, $5);
$$;

revoke all on function private.set_store_business_hours(uuid, smallint, boolean, time, time)
  from public, anon;
revoke all on function public.set_store_business_hours(uuid, smallint, boolean, time, time)
  from public, anon;
grant execute on function private.set_store_business_hours(uuid, smallint, boolean, time, time)
  to authenticated;
grant execute on function public.set_store_business_hours(uuid, smallint, boolean, time, time)
  to authenticated;

-- Without this revoke, authenticated callers could bypass the transactional
-- guard through the Data API even though the owner/admin RLS policies remain.
revoke insert, update, delete on public.store_business_hours from authenticated;

comment on function public.set_store_business_hours(uuid, smallint, boolean, time, time) is
  'Guardado de horario habitual owner/admin, serializado frente a checkout y bloqueado si hay pedidos futuros programados.';

commit;
