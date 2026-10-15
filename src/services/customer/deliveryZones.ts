import { customerStoreSlug, getPublicCustomerClient } from './checkoutSchedule';

export type DeliveryZone = {
  id: string;
  name: string;
  district: string;
  fee_cents: number;
  minimum_order_cents: number;
  restrictions: string | null;
};

export async function listDeliveryZones(): Promise<DeliveryZone[]> {
  const { data, error } = await getPublicCustomerClient().rpc('get_customer_delivery_zones', {
    p_store_slug: customerStoreSlug,
  });
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('No pudimos consultar las zonas.');
  return data.map((value) => {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      typeof value.id !== 'string' ||
      typeof value.name !== 'string' ||
      typeof value.district !== 'string' ||
      typeof value.fee_cents !== 'number' ||
      !Number.isSafeInteger(value.fee_cents) ||
      value.fee_cents < 0 ||
      typeof value.minimum_order_cents !== 'number' ||
      !Number.isSafeInteger(value.minimum_order_cents) ||
      value.minimum_order_cents < 0
    )
      throw new Error('La configuración de zonas no es válida.');
    return {
      id: value.id,
      name: value.name,
      district: value.district,
      fee_cents: value.fee_cents,
      minimum_order_cents: value.minimum_order_cents,
      restrictions: typeof value.restrictions === 'string' ? value.restrictions : null,
    };
  });
}
