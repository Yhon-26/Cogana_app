import { randomUUID } from 'expo-crypto';
import { getCustomerAuthClient } from './auth';
import { loadCustomerOrder } from './payments';
import type { Json } from '@/types/database.generated';

export const orderStatusLabels: Record<string, string> = {
  pending_payment: 'Pendiente de pago',
  queued: 'Recibido',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  awaiting_adjustment: 'Diferencia de pago pendiente',
  ready_for_pickup: 'Listo para recoger',
  ready_for_delivery: 'Listo para reparto',
  out_for_delivery: 'En camino',
  completed: 'Entregado',
  cancelled: 'Cancelado',
};
function object(value: Json | undefined): Record<string, Json | undefined> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('La respuesta del pedido no es válida.');
  return value;
}
function string(value: Json | undefined) {
  if (typeof value !== 'string') throw new Error('El pedido no contiene los datos esperados.');
  return value;
}
function amount(value: Json | undefined) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value))
    throw new Error('El importe o cantidad del pedido no es válido.');
  return value;
}
function nullableAmount(value: Json | undefined) {
  return value === null ? null : amount(value);
}
function list(value: Json | undefined) {
  if (!Array.isArray(value)) throw new Error('No pudimos leer el detalle del pedido.');
  return value.map(object);
}
export function parseOrderDetails(value: Json) {
  const result = object(value);
  const order = object(result.order);
  const instructions =
    result.payment_instructions === null ? null : object(result.payment_instructions);
  return {
    order: {
      id: string(order.id),
      storeId: string(order.store_id),
      number: string(order.order_number),
      status: string(order.status),
      paymentStatus: string(order.payment_status),
      paymentMethod: string(order.payment_method),
      mode: string(order.fulfillment_type),
      scheduledFor: order.scheduled_for === null ? null : string(order.scheduled_for),
      estimatedTotal: amount(order.estimated_total_cents),
      finalTotal: nullableAmount(order.final_total_cents),
    },
    code: result.confirmation_code === null ? null : string(result.confirmation_code),
    recipient: instructions
      ? { name: string(instructions.name), phone: string(instructions.phone) }
      : null,
    items: list(result.items).map((item) => ({
      id: string(item.id),
      name: string(item.name),
      presentation: string(item.presentation),
      unit: string(item.unit),
      estimatedQuantity: amount(item.estimated_quantity),
      preparedQuantity: nullableAmount(item.prepared_quantity),
      estimatedLine: amount(item.estimated_line_cents),
      finalLine: nullableAmount(item.final_line_cents),
      discount: amount(item.discount_cents),
    })),
    history: list(result.history).map((item) => ({
      status: string(item.status),
      at: string(item.at),
    })),
    substitutions: list(result.substitutions).map((item) => ({
      id: string(item.id),
      itemId: string(item.item_id),
      name: string(item.name),
      presentation: string(item.presentation),
      quantity: amount(item.quantity),
      difference: amount(item.difference_cents),
      status: string(item.status),
      expiresAt: item.expires_at === null ? null : string(item.expires_at),
    })),
    differences: list(result.differences).map((item) => ({
      id: string(item.id),
      type: string(item.type),
      amount: amount(item.amount_cents),
      status: string(item.status),
    })),
  };
}
export async function loadCustomerOrderDetails(orderId?: string) {
  if (!orderId) orderId = (await loadCustomerOrder())?.id;
  if (!orderId) return null;
  const { data, error } = await getCustomerAuthClient().rpc('get_customer_order_details', {
    p_order_id: orderId,
  });
  if (error)
    throw new Error(
      error.code === '42501' ? error.message : 'No pudimos cargar el pedido. Reintenta.',
    );
  return parseOrderDetails(data);
}
export async function decideCustomerSubstitution(
  storeId: string,
  substitutionId: string,
  decision: 'accepted' | 'rejected',
  operationId = randomUUID(),
) {
  const { error } = await getCustomerAuthClient().rpc('decide_substitution', {
    p_store_id: storeId,
    p_substitution_id: substitutionId,
    p_decision: decision,
    p_operation_id: operationId,
  });
  if (error)
    throw new Error(
      ['P0001', '42501', '22023'].includes(error.code)
        ? error.message
        : 'No pudimos guardar tu respuesta. Actualiza el pedido.',
    );
}
export async function cancelCustomerOrder(orderId: string, operationId = randomUUID()) {
  const { error } = await getCustomerAuthClient().rpc('cancel_customer_order', {
    p_order_id: orderId,
    p_operation_id: operationId,
  });
  if (error)
    throw new Error(
      ['P0001', '42501', '22023'].includes(error.code)
        ? error.message
        : 'No pudimos cancelar. Actualiza el estado antes de reintentar.',
    );
}
export async function reportCustomerAdjustment(transactionId: string, reference: string) {
  const { error } = await getCustomerAuthClient().rpc('report_customer_adjustment', {
    p_transaction_id: transactionId,
    p_reference: reference.trim(),
  });
  if (error)
    throw new Error(
      ['P0001', '42501', '22023'].includes(error.code)
        ? error.message
        : 'No pudimos registrar la referencia. Actualiza el pedido antes de reintentar.',
    );
}
