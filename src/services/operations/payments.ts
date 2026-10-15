import { randomUUID } from 'expo-crypto';
import { requireAuthorizedStore } from './access';
import { getSupabaseClient } from '../supabase/client';

export async function confirmReceivedPayment(
  storeId: string,
  orderId: string,
  transactionId: string,
  reference: string,
  operationId = randomUUID(),
) {
  await requireAuthorizedStore(storeId);
  if (!reference.trim()) throw new Error('Escribe la referencia comprobada en tu cuenta.');
  const client = getSupabaseClient();
  if (!client) throw new Error('No se pudo conectar con la tienda.');
  const { error } = await client.rpc('confirm_manual_payment', {
    p_store_id: storeId,
    p_order_id: orderId,
    p_transaction_id: transactionId,
    p_operation_id: operationId,
    p_provider_reference: reference.trim(),
  });
  if (error)
    throw new Error(
      ['P0001', '42501', '22023'].includes(error.code)
        ? error.message
        : 'No pudimos confirmar el pago. Actualiza el estado antes de reintentar.',
    );
}
