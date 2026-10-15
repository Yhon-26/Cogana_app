import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';
import { getSupabaseConfig } from '../config';

export type PublicBusinessDay = {
  weekday: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};

export type PublicScheduleException = {
  local_date: string;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  public_message: string | null;
};

export type PublicCheckoutSchedule = {
  timezone: string;
  operationalStatus: string;
  hours: PublicBusinessDay[];
  exceptions: PublicScheduleException[];
  slots: CheckoutSlot[];
};

export type CheckoutSlot = { starts_at: string; ends_at: string; available: boolean };
export type SelectedCheckoutSlot = CheckoutSlot & {
  storeSlug: string;
  mode: 'delivery' | 'pickup';
  timezone: string;
};

export function formatCheckoutSlot(slot: SelectedCheckoutSlot) {
  const date = new Intl.DateTimeFormat('es-PE', {
    timeZone: slot.timezone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(slot.starts_at));
  const time = new Intl.DateTimeFormat('es-PE', {
    timeZone: slot.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date} · ${time.format(new Date(slot.starts_at))}–${time.format(new Date(slot.ends_at))}`;
}

// La app atiende una tienda por ahora. Al añadir selección de tienda, pasar
// el slug seleccionado a loadPublicCheckoutSchedule en lugar de este valor.
export const customerStoreSlug =
  process.env.EXPO_PUBLIC_CUSTOMER_STORE_SLUG?.trim() || 'cogana-santa-anita';

let publicClient: SupabaseClient<Database> | null = null;

export function getPublicCustomerClient() {
  if (publicClient) return publicClient;
  const config = getSupabaseConfig();
  if (!config) throw new Error('No se configuró la conexión pública de Supabase.');
  // Cliente separado sin sesión: la RLS pública solo expone columnas de horario.
  publicClient = createClient<Database>(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return publicClient;
}

function localDate(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export async function loadPublicCheckoutSchedule(
  storeSlug: string,
  mode: 'delivery' | 'pickup' = 'delivery',
): Promise<PublicCheckoutSchedule> {
  const db = getPublicCustomerClient();
  const { data: store, error: storeError } = await db
    .from('stores')
    .select('id,timezone')
    .eq('slug', storeSlug)
    .eq('status', 'active')
    .maybeSingle();
  if (storeError) throw storeError;
  if (!store) throw new Error('La tienda no está disponible.');

  const [hours, exceptions, state, slots] = await Promise.all([
    db
      .from('store_business_hours')
      .select('weekday,opens_at,closes_at,is_closed')
      .eq('store_id', store.id)
      .order('weekday'),
    db
      .from('store_schedule_exceptions')
      .select('local_date,opens_at,closes_at,is_closed,public_message')
      .eq('store_id', store.id)
      .gte('local_date', localDate(store.timezone))
      .order('local_date')
      .limit(14),
    db.from('store_operational_state').select('status').eq('store_id', store.id).maybeSingle(),
    db.rpc('get_checkout_slots', { p_store_slug: storeSlug, p_mode: mode, p_days: 7 }),
  ]);
  if (hours.error) throw hours.error;
  if (exceptions.error) throw exceptions.error;
  if (state.error) throw state.error;
  if (slots.error) throw slots.error;

  return {
    timezone: store.timezone,
    operationalStatus: state.data?.status ?? 'closed',
    hours: hours.data ?? [],
    exceptions: exceptions.data ?? [],
    slots: slots.data ?? [],
  };
}
