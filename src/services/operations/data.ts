import { requireAuthorizedStore } from './access';
import { getSupabaseClient } from '@/services/supabase/client';

function db() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  return client;
}

// Todas las lecturas exigen owner/admin activo y aplican store_id además de RLS.
// Seleccionamos solo campos de UI: no hashes, pruebas de pago ni datos privados.
export async function loadOperationsOverview(storeId: string) {
  await requireAuthorizedStore(storeId);
  const client = db();
  const [orders, state, preparing, pending] = await Promise.all([
    client
      .from('orders')
      .select('id,order_number,status,payment_status,created_at', { count: 'exact' })
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(20),
    client
      .from('store_operational_state')
      .select('status,public_message')
      .eq('store_id', storeId)
      .maybeSingle(),
    client
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .in('status', ['queued', 'confirmed', 'preparing']),
    client
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('payment_status', 'pending'),
  ]);
  if (orders.error) throw orders.error;
  if (state.error) throw state.error;
  if (preparing.error) throw preparing.error;
  if (pending.error) throw pending.error;
  return {
    orders: orders.data ?? [],
    total: orders.count ?? 0,
    preparing: preparing.count ?? 0,
    pending: pending.count ?? 0,
    state: state.data,
  };
}

export async function loadOperationsOrders(storeId: string) {
  await requireAuthorizedStore(storeId);
  const { data, error } = await db()
    .from('orders')
    .select(
      'id,order_number,status,payment_status,payment_method,fulfillment_type,scheduled_for,created_at,estimated_total_cents',
    )
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function loadOperationsOrder(storeId: string, orderId: string) {
  await requireAuthorizedStore(storeId);
  const client = db();
  const [order, items] = await Promise.all([
    client
      .from('orders')
      .select(
        'id,order_number,status,payment_status,payment_method,fulfillment_type,scheduled_for,created_at,estimated_total_cents,final_total_cents',
      )
      .eq('store_id', storeId)
      .eq('id', orderId)
      .maybeSingle(),
    client
      .from('order_items')
      .select(
        'id,presentation_id,product_name_snapshot,presentation_name_snapshot,base_unit_snapshot,estimated_quantity,pricing_quantity_snapshot,requested_quantity,estimated_line_cents,prepared_quantity,final_line_cents',
      )
      .eq('store_id', storeId)
      .eq('order_id', orderId),
  ]);
  if (order.error) throw order.error;
  if (items.error) throw items.error;
  return { order: order.data, items: items.data ?? [] };
}

export async function loadOperationsCatalog(storeId: string) {
  await requireAuthorizedStore(storeId);
  const client = db();
  const [products, presentations, lots, packages] = await Promise.all([
    client
      .from('products')
      .select(
        'id,name,sku,brand,description,is_active,minimum_stock_quantity,base_unit,tracks_expiration',
      )
      .eq('store_id', storeId)
      .order('name'),
    client
      .from('product_presentations')
      .select('id,product_id,name,sku,price_cents,is_active,base_quantity,is_sealed')
      .eq('store_id', storeId)
      .order('name'),
    client
      .from('inventory_lots')
      .select('id,product_id,loose_on_hand_quantity,status,expires_on')
      .eq('store_id', storeId),
    client
      .from('inventory_lot_packages')
      .select('lot_id,presentation_id,sealed_on_hand_units')
      .eq('store_id', storeId),
  ]);
  for (const result of [products, presentations, lots, packages])
    if (result.error) throw result.error;
  return {
    products: products.data ?? [],
    presentations: presentations.data ?? [],
    lots: lots.data ?? [],
    packages: packages.data ?? [],
  };
}

export async function loadProductPriceHistory(storeId: string, presentationIds: string[]) {
  await requireAuthorizedStore(storeId);
  if (!presentationIds.length) return [];
  const { data, error } = await db()
    .from('product_price_history')
    .select('id,presentation_id,old_price_cents,new_price_cents,reason,changed_at')
    .eq('store_id', storeId)
    .in('presentation_id', presentationIds)
    .order('changed_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data ?? [];
}

export async function loadStoreManagement(storeId: string) {
  await requireAuthorizedStore(storeId);
  const client = db();
  const [settings, state, hours, exceptions, zones, rules] = await Promise.all([
    client
      .from('store_settings')
      .select(
        'display_name,phone,whatsapp_phone,accepts_pickup,accepts_delivery,accepts_cash_pickup,accepts_yape,accepts_plin,accepts_card',
      )
      .eq('store_id', storeId)
      .maybeSingle(),
    client
      .from('store_operational_state')
      .select('status,public_message,estimated_resume_at')
      .eq('store_id', storeId)
      .maybeSingle(),
    client
      .from('store_business_hours')
      .select('weekday,opens_at,closes_at,is_closed')
      .eq('store_id', storeId)
      .order('weekday'),
    client
      .from('store_schedule_exceptions')
      .select('id,local_date,opens_at,closes_at,is_closed,public_message')
      .eq('store_id', storeId)
      .order('local_date')
      .limit(20),
    client
      .from('delivery_zones')
      .select('id,name,district,fee_cents,minimum_order_cents,is_active')
      .eq('store_id', storeId)
      .order('name'),
    client
      .from('store_fulfillment_rules')
      .select('*')
      .eq('store_id', storeId)
      .order('fulfillment_type'),
  ]);
  for (const result of [settings, state, hours, exceptions, zones, rules])
    if (result.error) throw result.error;
  return {
    settings: settings.data,
    state: state.data,
    hours: hours.data ?? [],
    exceptions: exceptions.data ?? [],
    zones: zones.data ?? [],
    rules: rules.data ?? [],
  };
}

export async function loadOperationsPayments(storeId: string, transactionId?: string) {
  await requireAuthorizedStore(storeId);
  const query = () =>
    db()
      .from('payment_transactions')
      .select(
        'id,order_id,transaction_type,method,provider,amount_cents,status,created_at,customer_payment_reference',
      )
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
  if (transactionId) {
    const result = await query().eq('id', transactionId);
    if (result.error) throw result.error;
    return result.data ?? [];
  }
  const [pending, recent] = await Promise.all([
    query().in('status', ['pending', 'requires_action', 'processing']).limit(100),
    query().limit(50),
  ]);
  if (pending.error) throw pending.error;
  if (recent.error) throw recent.error;
  return [
    ...new Map(
      [...(pending.data ?? []), ...(recent.data ?? [])].map((item) => [item.id, item]),
    ).values(),
  ];
}

export async function loadOperationsDeliveries(storeId: string) {
  await requireAuthorizedStore(storeId);
  const client = db();
  const [orders, assignments] = await Promise.all([
    client
      .from('orders')
      .select('id,order_number,status,scheduled_for')
      .eq('store_id', storeId)
      .eq('fulfillment_type', 'delivery')
      .order('created_at', { ascending: false })
      .limit(50),
    client
      .from('delivery_assignments')
      .select('id,order_id,driver_user_id,status,assigned_at')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);
  if (orders.error) throw orders.error;
  if (assignments.error) throw assignments.error;
  return { orders: orders.data ?? [], assignments: assignments.data ?? [] };
}

export async function loadOperationsActivity(storeId: string) {
  await requireAuthorizedStore(storeId);
  const client = db();
  const [orders, inventory, prices] = await Promise.all([
    client
      .from('orders')
      .select('id,order_number,created_at')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(20),
    client
      .from('inventory_movements')
      .select('id,movement_type,created_at')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(20),
    client
      .from('product_price_history')
      .select('id,presentation_id,old_price_cents,changed_at')
      .eq('store_id', storeId)
      .order('changed_at', { ascending: false })
      .limit(20),
  ]);
  if (orders.error) throw orders.error;
  if (inventory.error) throw inventory.error;
  if (prices.error) throw prices.error;
  const presentationIds = [...new Set((prices.data ?? []).map((row) => row.presentation_id))];
  const { data: presentations, error: presentationsError } = presentationIds.length
    ? await client
        .from('product_presentations')
        .select('id,name,product_id')
        .eq('store_id', storeId)
        .in('id', presentationIds)
    : { data: [], error: null };
  if (presentationsError) throw presentationsError;
  const productIds = [...new Set((presentations ?? []).map((row) => row.product_id))];
  const { data: products, error: productsError } = productIds.length
    ? await client.from('products').select('id,name').eq('store_id', storeId).in('id', productIds)
    : { data: [], error: null };
  if (productsError) throw productsError;
  const presentationById = new Map((presentations ?? []).map((row) => [row.id, row]));
  const productNameById = new Map((products ?? []).map((row) => [row.id, row.name]));
  return [
    ...(orders.data ?? []).map((row) => ({
      id: row.id,
      title: `Pedido ${row.order_number} recibido`,
      at: row.created_at,
    })),
    ...(inventory.data ?? []).map((row) => ({
      id: row.id,
      title: `Inventario: ${row.movement_type}`,
      at: row.created_at,
    })),
    ...(prices.data ?? []).map((row) => {
      const presentation = presentationById.get(row.presentation_id);
      const productName = presentation && productNameById.get(presentation.product_id);
      const itemName = [productName, presentation?.name].filter(Boolean).join(' · ');
      return {
        id: row.id,
        title: `${row.old_price_cents === null ? 'Precio inicial' : 'Precio actualizado'} · ${itemName || 'Producto no disponible'}`,
        at: row.changed_at,
      };
    }),
  ].sort((a, b) => b.at.localeCompare(a.at));
}
