import { getCustomerAuthClient } from './auth';
import { sessionStorage } from '../supabase/storage';
import { customerStoreSlug, getPublicCustomerClient } from './checkoutSchedule';

export async function loadCustomerPaymentSettings() {
  const { data, error } = await getPublicCustomerClient().rpc('get_customer_payment_settings', {
    p_store_slug: customerStoreSlug,
  });
  if (error || !data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('No pudimos consultar los medios de pago.');
  const recipientReady = (value: unknown) => {
    if (!value || typeof value !== 'object') return false;
    const recipient = value as Record<string, unknown>;
    return (
      typeof recipient.name === 'string' &&
      recipient.name.trim().length > 0 &&
      typeof recipient.phone === 'string' &&
      recipient.phone.trim().length > 0
    );
  };
  const minutes =
    typeof data.window_minutes === 'number' &&
    Number.isInteger(data.window_minutes) &&
    data.window_minutes > 0
      ? data.window_minutes
      : null;
  return {
    minutes,
    yape: minutes !== null && recipientReady(data.yape),
    plin: minutes !== null && recipientReady(data.plin),
    cash: data.cash_pickup === true,
  };
}

export async function listCustomerOrders() {
  const client = getCustomerAuthClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new Error('Inicia sesión para consultar tus pedidos.');
  const { data, error: queryError } = await client
    .from('orders')
    .select(
      'id,order_number,status,payment_status,estimated_total_cents,final_total_cents,created_at',
    )
    .eq('requester_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (queryError) throw new Error('No pudimos consultar tus pedidos. Reintenta.');
  return data;
}

export async function loadCustomerOrder(orderId?: string) {
  const client = getCustomerAuthClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new Error('Inicia sesión para consultar tu pedido.');
  if (!orderId) {
    const saved = await sessionStorage.getItem(`checkout.last.${user.id}`);
    if (saved) orderId = (JSON.parse(saved) as { orderId: string }).orderId;
  }
  if (!orderId) return null;
  const { data, error: queryError } = await client
    .from('orders')
    .select(
      'id,store_id,order_number,status,payment_status,payment_method,estimated_total_cents,payment_due_at,payment_instructions,scheduled_for',
    )
    .eq('id', orderId)
    .eq('requester_user_id', user.id)
    .maybeSingle();
  if (queryError) throw new Error('No pudimos consultar el pedido. Reintenta.');
  return data;
}

export async function reportCustomerPayment(orderId: string, reference: string) {
  const { error } = await getCustomerAuthClient().rpc('report_customer_payment', {
    p_order_id: orderId,
    p_reference: reference.trim(),
  });
  if (error)
    throw new Error(
      ['P0001', '22023', '42501'].includes(error.code)
        ? error.message
        : 'No pudimos confirmar el envío de tu referencia. Reintenta.',
    );
}
