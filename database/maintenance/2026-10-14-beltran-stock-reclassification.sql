-- Confirmed by user: 500 sealed 1 L bottles at S/ 7.90 each.
-- Reclassification only; no increase in physical quantity. Replay safe.
begin;
do $$
declare
  v_store constant uuid := '03c25d8b-847f-4021-86bb-22d1955bbe6e';
  v_product constant uuid := '49ed531c-c52a-4ffc-be07-35a68e54054e';
  v_presentation constant uuid := '572c593c-33a4-44f2-b61f-473475ac614d';
  v_lot constant uuid := 'dd662de2-b80e-4e17-82d3-4d3790dcfb04';
  v_operation constant uuid := 'b6558c55-d20c-466d-92e1-729ce83ef6ef';
  v_available bigint;
begin
  perform 1 from public.products where store_id=v_store and id=v_product
    and base_unit='unit' and is_active for update;
  if not found then raise exception 'Product changed; review correction'; end if;
  perform 1 from public.product_presentations where store_id=v_store
    and product_id=v_product and id=v_presentation and price_cents=790
    and is_sealed and is_active for update;
  if not found then raise exception 'Presentation changed; review correction'; end if;
  perform 1 from public.inventory_lots where store_id=v_store and id=v_lot
    and product_id=v_product and status='available' and expires_on='2027-02-28' for update;
  if not found then raise exception 'Lot changed; review correction'; end if;
  if exists (select 1 from public.inventory_movements where store_id=v_store and operation_id=v_operation) then
    return;
  end if;
  if exists (select 1 from public.order_items where store_id=v_store and product_id=v_product)
    or exists (select 1 from public.inventory_reservation_allocations where store_id=v_store and lot_id=v_lot)
    or exists (select 1 from public.inventory_lot_packages where store_id=v_store and lot_id=v_lot)
    or not exists (select 1 from public.inventory_lots where id=v_lot and loose_on_hand_quantity=500)
    or not exists (select 1 from public.product_presentations where id=v_presentation and base_quantity=500)
  then raise exception 'Stock or commercial activity changed; review correction'; end if;
  update public.product_presentations set base_quantity=1,updated_at=statement_timestamp()
    where store_id=v_store and id=v_presentation;
  update public.inventory_lots set loose_on_hand_quantity=0,updated_at=statement_timestamp()
    where store_id=v_store and id=v_lot;
  insert into public.inventory_lot_packages(store_id,lot_id,presentation_id,sealed_on_hand_units)
    values(v_store,v_lot,v_presentation,500);
  insert into public.inventory_movements(store_id,product_id,lot_id,presentation_id,movement_type,
    base_quantity_delta,loose_quantity_delta,sealed_units_delta,reason,reference_type,reference_id,operation_id)
    values(v_store,v_product,v_lot,v_presentation,'adjustment',0,-500,500,
      'Correccion autorizada por titular: 500 botellas cerradas de 1 L a S/ 7.90. Reclasificacion de suelto a sellado; total fisico conservado.',
      'inventory_lot',v_lot,v_operation);
  select (item->>'available_quantity')::bigint into v_available
    from jsonb_array_elements(public.get_customer_catalog('cogana-santa-anita')) item
    where item->>'id'=v_presentation::text;
  if v_available is distinct from 500 then raise exception 'Expected 500 sellable bottles, got %',v_available; end if;
end $$;
commit;
