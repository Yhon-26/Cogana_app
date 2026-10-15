import { randomUUID, digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';
import { getCustomerAuthClient } from './auth';
import { sessionStorage } from '../supabase/storage';
import { buildCheckoutPayload, parseCheckoutResult, type CheckoutInput } from './checkoutContract';

type Attempt = { operationId: string; fingerprint: string };
let submitting = false;

// The server determines the deadline. Persist only operation key/hash and a
// last-order pointer, never the customer's address or cart.
export async function submitCheckout(input: CheckoutInput) {
  if (submitting) throw new Error('El pedido ya se está enviando.');
  submitting = true;
  try {
    const client = getCustomerAuthClient();
    if (!client) throw new Error('No se pudo conectar con la tienda.');
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user || user.is_anonymous)
      throw new Error('Inicia sesión para crear tu pedido.');
    const payload = buildCheckoutPayload(input);
    const fingerprint = await digestStringAsync(
      CryptoDigestAlgorithm.SHA256,
      JSON.stringify(payload),
    );
    const key = `checkout.${user.id}.${input.storeId}`;
    const saved = await sessionStorage.getItem(key);
    let attempt: Attempt;
    if (saved) {
      attempt = JSON.parse(saved) as Attempt;
      if (!attempt.operationId || !attempt.fingerprint)
        throw new Error('No se pudo recuperar el intento anterior.');
      // A response can be lost after the transaction committed. Recover it before
      // checking cart changes or expiry, and never create a second operation silently.
      const { data: order, error } = await client
        .from('orders')
        .select('id,order_number,status,payment_status,estimated_total_cents,payment_due_at')
        .eq('store_id', input.storeId)
        .eq('requester_user_id', user.id)
        .eq('operation_id', attempt.operationId)
        .maybeSingle();
      if (error) throw new Error('No pudimos comprobar el pedido anterior. Reintenta.');
      if (order) {
        await sessionStorage.setItem(
          `checkout.last.${user.id}`,
          JSON.stringify({ storeId: input.storeId, orderId: order.id }),
        );
        return {
          ...parseCheckoutResult({
            ...order,
            order_id: order.id,
            reservation_expires_at: order.payment_due_at,
            idempotent_replay: true,
          }),
          matchesCurrentCart: attempt.fingerprint === fingerprint,
        };
      }
      if (attempt.fingerprint !== fingerprint)
        throw new Error(
          'Hay un envío anterior sin confirmar. Recupera ese pedido antes de cambiar la compra.',
        );
    } else {
      attempt = { operationId: randomUUID(), fingerprint };
      await sessionStorage.setItem(key, JSON.stringify(attempt));
    }
    const { data, error } = await client.rpc('submit_customer_order', {
      p_payload: payload,
      p_operation_id: attempt.operationId,
    });
    if (error) {
      // Postgres validation errors roll back atomically; uncertain transport errors
      // retain the journal so retry uses exactly the same operation ID.
      if (['22023', 'P0001', '42501', '23514'].includes(error.code)) {
        await sessionStorage.removeItem(key);
        throw new Error(error.message);
      }
      throw new Error('No pudimos confirmar el pedido. Reintenta para recuperar el mismo envío.');
    }
    const result = parseCheckoutResult(data);
    await sessionStorage.setItem(
      `checkout.last.${user.id}`,
      JSON.stringify({ storeId: input.storeId, orderId: result.orderId }),
    );
    return { ...result, matchesCurrentCart: true };
  } finally {
    submitting = false;
  }
}

// Call only after the confirmed result is shown and the purchased cart is cleared.
export async function acknowledgeCheckout(storeId: string, orderId: string) {
  const client = getCustomerAuthClient();
  if (!client) return;
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return;
  const key = `checkout.${user.id}.${storeId}`;
  const saved = await sessionStorage.getItem(key);
  if (!saved) return;
  const attempt = JSON.parse(saved) as Attempt;
  const { data, error } = await client
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('store_id', storeId)
    .eq('requester_user_id', user.id)
    .eq('operation_id', attempt.operationId)
    .maybeSingle();
  if (!error && data) await sessionStorage.removeItem(key);
}
