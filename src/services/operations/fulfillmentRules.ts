import { requireAuthorizedStore } from './access';
import { getSupabaseClient } from '@/services/supabase/client';
import type { Database } from '@/types/database.generated';

export type FulfillmentRule = Database['public']['Tables']['store_fulfillment_rules']['Row'];
export type FulfillmentRuleInput = {
  mode: 'pickup' | 'delivery';
  slotMinutes: number;
  maxOrders: number;
  noticeMinutes: number;
  deliveryStaffCount?: number;
};

export async function saveFulfillmentRule(storeId: string, input: FulfillmentRuleInput) {
  if (
    input.mode === 'delivery' &&
    (!Number.isInteger(input.deliveryStaffCount) ||
      input.deliveryStaffCount! < 0 ||
      input.deliveryStaffCount! > 100)
  )
    throw new Error('Indica entre 0 y 100 personas disponibles para reparto.');
  if (
    !Number.isInteger(input.slotMinutes) ||
    input.slotMinutes < 1 ||
    input.slotMinutes > 1440 ||
    !Number.isInteger(input.maxOrders) ||
    input.maxOrders < 1 ||
    input.maxOrders > 1000 ||
    !Number.isInteger(input.noticeMinutes) ||
    input.noticeMinutes < 0 ||
    input.noticeMinutes > 10080
  )
    throw new Error('Revisa la duración, el cupo y la anticipación.');
  await requireAuthorizedStore(storeId);
  const db = getSupabaseClient();
  if (!db) throw new Error('Supabase no está configurado.');
  // La base verifica owner/admin y protege los pedidos futuros de esta modalidad.
  const { error } = await db.rpc('set_fulfillment_rules', {
    p_store_id: storeId,
    p_mode: input.mode,
    p_slot_minutes: input.slotMinutes,
    p_max_orders: input.maxOrders,
    p_notice_minutes: input.noticeMinutes,
    ...(input.mode === 'delivery' ? { p_delivery_staff_count: input.deliveryStaffCount } : {}),
  });
  if (error) throw new Error(error.message);
}
