import { cartLinePayload, type CustomerCartLine } from './cart';

export type CheckoutInput = {
  storeId: string;
  mode: 'delivery' | 'pickup';
  paymentMethod: 'yape' | 'plin' | 'cash';
  customer: { name: string; phone: string };
  scheduledFor: string;
  lines: readonly CustomerCartLine[];
  delivery?: { zoneId: string; district: string; address: string; reference: string };
};

// Build only purchase intent. Prices, shipping, stock and capacity belong to the server.
export function buildCheckoutPayload(input: CheckoutInput) {
  const name = input.customer.name.trim();
  const phone = input.customer.phone.replace(/[\s()-]/g, '');
  if (!name || name.length > 120) throw new Error('Escribe el nombre de quien recibirá el pedido.');
  if (!/^\+?[0-9]{9,15}$/.test(phone)) throw new Error('Revisa el número de contacto.');
  if (!input.lines.length) throw new Error('Tu carrito está vacío.');
  if (!Number.isFinite(Date.parse(input.scheduledFor))) throw new Error('Elige un horario válido.');
  if (input.mode === 'delivery' && input.paymentMethod === 'cash')
    throw new Error('El efectivo solo está disponible para recojo.');
  const delivery = input.delivery;
  if (
    input.mode === 'delivery' &&
    (!delivery?.zoneId || !delivery.address.trim() || !delivery.district.trim())
  )
    throw new Error('Completa la zona y dirección de entrega.');
  if (new Set(input.lines.map((line) => line.productId)).size !== input.lines.length)
    throw new Error('Revisa los productos repetidos en tu carrito.');
  return {
    store_id: input.storeId,
    source: 'android',
    fulfillment_type: input.mode,
    payment_method: input.paymentMethod,
    customer: { name, phone },
    scheduled_for: input.scheduledFor,
    delivery_zone_id: input.mode === 'delivery' ? delivery!.zoneId : null,
    delivery_address:
      input.mode === 'delivery'
        ? {
            district: delivery!.district.trim(),
            address: delivery!.address.trim(),
            reference: delivery!.reference.trim(),
          }
        : null,
    items: input.lines.map((line) => {
      const value = line.bulk?.value ?? line.quantity;
      if (!Number.isSafeInteger(value) || value <= 0)
        throw new Error('Revisa las cantidades del carrito.');
      return cartLinePayload(line);
    }),
  };
}

export type CheckoutResult = {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  reservationExpiresAt: string | null;
  replayed: boolean;
};

export function parseCheckoutResult(data: unknown): CheckoutResult {
  if (!data || typeof data !== 'object')
    throw new Error('No se pudo confirmar la respuesta del pedido.');
  const row = data as Record<string, unknown>;
  if (
    typeof row.order_id !== 'string' ||
    typeof row.order_number !== 'string' ||
    typeof row.status !== 'string' ||
    typeof row.payment_status !== 'string' ||
    typeof row.estimated_total_cents !== 'number' ||
    !Number.isSafeInteger(row.estimated_total_cents) ||
    row.estimated_total_cents < 0
  )
    throw new Error('No se pudo confirmar la respuesta del pedido.');
  return {
    orderId: row.order_id,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    totalCents: row.estimated_total_cents,
    reservationExpiresAt:
      typeof row.reservation_expires_at === 'string' ? row.reservation_expires_at : null,
    replayed: row.idempotent_replay === true,
  };
}
