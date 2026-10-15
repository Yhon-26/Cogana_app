import { requireAuthorizedStore } from './access';
import { getSupabaseClient } from '@/services/supabase/client';

export type OperationalStatus = 'closed' | 'accepting_orders' | 'preparing_orders' | 'paused';

// La apertura y el cierre escriben store_operational_state directamente:
// la RLS solo permite insert/update a owner/admin de la tienda. El registro
// de pedidos futuros y la capacidad de franjas quedan protegidos en la base.
export async function setStoreOperationalStatus(
  storeId: string,
  status: Extract<OperationalStatus, 'closed' | 'accepting_orders' | 'paused'>,
) {
  await requireAuthorizedStore(storeId);
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) throw new Error('Tu sesión expiró; vuelve a entrar.');
  const { error } = await client
    .from('store_operational_state')
    .upsert({ store_id: storeId, status, changed_by: userData.user.id }, { onConflict: 'store_id' });
  if (error) throw error;
}
