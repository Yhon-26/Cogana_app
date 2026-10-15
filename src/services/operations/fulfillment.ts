import { randomUUID } from 'expo-crypto';
import { requireAuthorizedStore } from './access';
import { getSupabaseClient } from '../supabase/client';
import type { Database } from '@/types/database.generated';

type Functions = Database['public']['Functions'];
type Operation =
  | 'transition_order'
  | 'finalize_weighted_order'
  | 'assign_delivery'
  | 'complete_pickup'
  | 'complete_delivery'
  | 'propose_substitution'
  | 'settle_manual_difference'
  | 'reject_manual_payment';
export async function runOrderOperation<N extends Operation>(name: N, args: Functions[N]['Args']) {
  await requireAuthorizedStore(args.p_store_id);
  const client = getSupabaseClient();
  if (!client) throw new Error('No se pudo conectar con la tienda.');
  const { data, error } = await client.rpc(name, args);
  if (error)
    throw new Error(
      ['P0001', '42501', '22023', '23505'].includes(error.code)
        ? error.message
        : 'No pudimos guardar. Actualiza el pedido antes de reintentar.',
    );
  return data;
}

export const changeOrderStatus = (
  storeId: string,
  orderId: string,
  status: string,
  operationId = randomUUID(),
  reason?: string,
) =>
  runOrderOperation('transition_order', {
    p_store_id: storeId,
    p_order_id: orderId,
    p_to_status: status,
    p_operation_id: operationId,
    p_reason_code: reason,
  });

export async function loadDeliveryTeam(storeId: string) {
  await requireAuthorizedStore(storeId);
  const client = getSupabaseClient();
  if (!client) throw new Error('No se pudo conectar con la tienda.');
  const { data, error } = await client
    .from('store_memberships')
    .select('user_id,role')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .in('role', ['owner', 'admin', 'driver']);
  if (error) throw new Error('No pudimos cargar el equipo de reparto.');
  const ids = (data ?? []).map((item) => item.user_id);
  if (!ids.length) return [];
  const profiles = await client.from('profiles').select('id,full_name').in('id', ids);
  if (profiles.error) throw new Error('No pudimos cargar los nombres del equipo.');
  return (data ?? []).map((item) => ({
    ...item,
    name:
      profiles.data?.find((profile) => profile.id === item.user_id)?.full_name ??
      'Integrante de la tienda',
  }));
}
