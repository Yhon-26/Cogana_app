-- Datos minimos de arranque. No crea usuarios ni inventa datos legales.

begin;

do $$
declare
  v_organization_id uuid;
  v_store_id uuid;
begin
  if exists (select 1 from public.stores where slug = 'cogana-santa-anita') then
    return;
  end if;

  insert into public.organizations (name, status)
  values ('Cogana', 'active')
  returning id into v_organization_id;

  insert into public.stores (
    organization_id,
    code,
    name,
    slug,
    district,
    timezone,
    status
  ) values (
    v_organization_id,
    'SANTA_ANITA',
    'Cogana Santa Anita',
    'cogana-santa-anita',
    'Santa Anita',
    'America/Lima',
    'active'
  )
  returning id into v_store_id;

  insert into public.store_settings (
    store_id,
    display_name,
    currency,
    locale,
    accepts_pickup,
    accepts_delivery,
    accepts_cash_pickup,
    accepts_yape,
    accepts_plin,
    accepts_card,
    default_preparation_minutes
  ) values (
    v_store_id,
    'Cogana',
    'PEN',
    'es-PE',
    true,
    true,
    true,
    true,
    true,
    false,
    30
  );

  insert into public.store_operational_state (
    store_id,
    status,
    public_message
  ) values (
    v_store_id,
    'closed',
    'La tienda todavía no inició la atención en línea.'
  );
end
$$;

commit;
