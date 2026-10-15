import { getSupabaseClient } from '@/services/supabase/client';
import type { Database } from '@/types/database.generated';

export type AuthorizedStore = {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
  timezone: string;
  role: 'owner' | 'admin';
};

function client() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Falta la configuración pública de Supabase.');
  return supabase;
}

// Nunca basta con estar en store_memberships: el rol driver también es miembro.
// La RLS del servidor sigue siendo la autoridad para cada lectura y escritura.
export async function listAuthorizedStores(): Promise<AuthorizedStore[]> {
  const supabase = client();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return [];
  const { data: memberships, error } = await supabase
    .from('store_memberships')
    .select('store_id,role')
    .eq('user_id', userData.user.id)
    .eq('is_active', true)
    .in('role', ['owner', 'admin']);
  if (error) throw error;
  if (!memberships?.length) return [];
  const ids = memberships.map((membership) => membership.store_id);
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('id,name,address,district,timezone')
    .in('id', ids)
    .eq('status', 'active');
  if (storesError) throw storesError;
  return (stores ?? []).map((store) => ({
    ...store,
    role: memberships.find((member) => member.store_id === store.id)?.role as 'owner' | 'admin',
  }));
}

export async function requireAuthorizedStore(storeId: string): Promise<AuthorizedStore> {
  const store = (await listAuthorizedStores()).find((item) => item.id === storeId);
  if (!store) throw new Error('No tienes acceso de owner/admin a esta tienda.');
  return store;
}

export async function sendOperationsCode(email: string) {
  if (process.env.EXPO_PUBLIC_OPERATIONS_EMAIL_OTP_READY !== 'true') {
    throw new Error('La plantilla de código OTP todavía no está configurada.');
  }
  const { error } = await client().auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: false },
  });
  if (error) throw error;
}

export async function verifyOperationsCode(email: string, token: string) {
  const { error } = await client().auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'email',
  });
  if (error) throw error;
  return listAuthorizedStores();
}

export type StoreTable = keyof Database['public']['Tables'];

export function subscribeOperationsAuth(onChange: () => void) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => undefined;
  const subscription = supabase.auth.onAuthStateChange(() => {
    // Supabase advierte contra esperar llamadas auth dentro de este callback.
    setTimeout(onChange, 0);
  });
  return () => subscription.data.subscription.unsubscribe();
}
