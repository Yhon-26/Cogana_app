-- Entrada de inventario: registro de lote nuevo con existencias iniciales
-- (granel suelto y/o paquetes sellados) e idempotencia por operation_id.

create or replace function private.receive_inventory_lot(
  p_store_id uuid,
  p_product_id uuid,
  p_lot_code text,
  p_expires_on date default null,
  p_supplier_id uuid default null,
  p_loose_quantity bigint default 0,
  p_sealed jsonb default null,
  p_notes text default null,
  p_operation_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_product public.products%rowtype;
  v_lot_id uuid;
  v_loose bigint := coalesce(p_loose_quantity, 0);
  v_sealed_total bigint := 0;
  v_sealed_row record;
  v_existing public.inventory_movements%rowtype;
begin
  if v_actor is null or not private.has_store_role(p_store_id, array['owner','admin']) then
    raise exception using errcode = '42501', message = 'No autorizado para registrar entradas de inventario';
  end if;
  if p_operation_id is null then
    raise exception using errcode = '22023', message = 'operation_id es obligatorio';
  end if;
  if p_lot_code is null or btrim(p_lot_code) = '' then
    raise exception using errcode = '22023', message = 'El código de lote es obligatorio';
  end if;
  if v_loose < 0 then
    raise exception using errcode = '22023', message = 'La cantidad suelta no puede ser negativa';
  end if;

  -- Idempotencia: repetir la misma operación devuelve el resultado previo.
  select * into v_existing
  from public.inventory_movements
  where store_id = p_store_id and operation_id = p_operation_id;
  if found then
    if v_existing.movement_type <> 'receipt' or v_existing.product_id <> p_product_id then
      raise exception using errcode = '23505', message = 'operation_id ya utilizado';
    end if;
    return jsonb_build_object(
      'lot_id', v_existing.lot_id,
      'loose_quantity_added', v_existing.loose_quantity_delta,
      'sealed_units_added', v_existing.sealed_units_delta,
      'idempotent_replay', true
    );
  end if;

  select * into v_product
  from public.products
  where store_id = p_store_id and id = p_product_id
  for share;
  if not found or not v_product.is_active then
    raise exception using errcode = 'P0001', message = 'Producto no disponible en esta tienda';
  end if;

  if p_supplier_id is not null and not exists (
    select 1 from public.suppliers
    where store_id = p_store_id and id = p_supplier_id and is_active
  ) then
    raise exception using errcode = 'P0001', message = 'Proveedor no disponible en esta tienda';
  end if;

  -- El código de lote es nuevo por producto: reabastecer usa un lote distinto.
  if exists (
    select 1 from public.inventory_lots
    where store_id = p_store_id and product_id = p_product_id
      and lot_code = btrim(p_lot_code)
  ) then
    raise exception using errcode = '23505', message = 'Ya existe un lote con ese código para este producto';
  end if;

  -- Validar paquetes sellados y totales antes de crear el lote.
  if p_sealed is not null then
    for v_sealed_row in
      select entry.presentation_id, entry.units
      from jsonb_to_recordset(p_sealed)
        as entry(presentation_id uuid, units bigint)
      where entry.units is not null and entry.units > 0
    loop
      if not exists (
        select 1 from public.product_presentations
        where store_id = p_store_id
          and id = v_sealed_row.presentation_id
          and product_id = p_product_id
          and is_sealed
          and is_active
      ) then
        raise exception using errcode = 'P0001', message = 'Presentación sellada no válida para este producto';
      end if;
      v_sealed_total := v_sealed_total + v_sealed_row.units;
    end loop;
  end if;

  if v_loose = 0 and v_sealed_total = 0 then
    raise exception using errcode = '22023',
      message = 'Registra al menos existencias sueltas o paquetes sellados';
  end if;

  insert into public.inventory_lots (
    store_id, product_id, supplier_id, lot_code, expires_on,
    loose_on_hand_quantity, status, notes, created_by
  ) values (
    p_store_id, p_product_id, p_supplier_id, btrim(p_lot_code), p_expires_on,
    v_loose, 'available', p_notes, v_actor
  )
  returning id into v_lot_id;

  if p_sealed is not null then
    for v_sealed_row in
      select entry.presentation_id, entry.units
      from jsonb_to_recordset(p_sealed)
        as entry(presentation_id uuid, units bigint)
      where entry.units is not null and entry.units > 0
    loop
      insert into public.inventory_lot_packages (
        store_id, lot_id, presentation_id, sealed_on_hand_units
      )
      select p_store_id, v_lot_id, v_sealed_row.presentation_id, v_sealed_row.units
      from public.product_presentations
      where store_id = p_store_id
        and id = v_sealed_row.presentation_id
        and product_id = p_product_id
        and is_sealed
        and is_active;
      if not found then
        raise exception using errcode = 'P0001', message = 'Presentación sellada no válida para este producto';
      end if;
    end loop;
  end if;

  insert into public.inventory_movements (
    store_id, product_id, lot_id, movement_type,
    base_quantity_delta, loose_quantity_delta, sealed_units_delta,
    reason, operation_id, actor_user_id
  ) values (
    p_store_id, p_product_id, v_lot_id, 'receipt',
    v_loose, v_loose, v_sealed_total,
    p_notes, p_operation_id, v_actor
  );

  return jsonb_build_object(
    'lot_id', v_lot_id,
    'loose_quantity_added', v_loose,
    'sealed_units_added', v_sealed_total,
    'idempotent_replay', false
  );
end;
$$;

create or replace function public.receive_inventory_lot(
  p_store_id uuid, p_product_id uuid, p_lot_code text,
  p_expires_on date default null, p_supplier_id uuid default null,
  p_loose_quantity bigint default 0, p_sealed jsonb default null,
  p_notes text default null, p_operation_id uuid default null
)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.receive_inventory_lot($1,$2,$3,$4,$5,$6,$7,$8,$9); $$;

revoke all on function private.receive_inventory_lot(uuid,uuid,text,date,uuid,bigint,jsonb,text,uuid)
  from public, anon;
revoke all on function public.receive_inventory_lot(uuid,uuid,text,date,uuid,bigint,jsonb,text,uuid)
  from public, anon;

grant execute on function private.receive_inventory_lot(uuid,uuid,text,date,uuid,bigint,jsonb,text,uuid)
  to authenticated, service_role;
grant execute on function public.receive_inventory_lot(uuid,uuid,text,date,uuid,bigint,jsonb,text,uuid)
  to authenticated;
