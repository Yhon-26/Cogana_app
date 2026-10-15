import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';
import { getSupabaseConfig } from '../config';
import { sessionStorage } from '../supabase/storage';

export type CustomerAuthChannel = 'email' | 'phone';
let client: SupabaseClient<Database> | null = null;

// A customer sign-in must never replace the owner's session or reuse it silently.
export function getCustomerAuthClient() {
  if (client) return client;
  const config = getSupabaseConfig();
  if (!config) throw new Error('No se pudo conectar con Cogana.');
  client = createClient<Database>(config.url, config.publishableKey, {
    auth: {
      storage: sessionStorage,
      storageKey: 'cogana.customer.auth',
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}

export function normalizeCustomerIdentity(channel: CustomerAuthChannel, input: string) {
  const value = input.trim();
  if (channel === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Revisa tu correo electrónico.');
    return value.toLowerCase();
  }
  const phone = value.replace(/[\s()-]/g, '');
  if (/^9\d{8}$/.test(phone)) return `+51${phone}`;
  if (/^\+519\d{8}$/.test(phone)) return phone;
  throw new Error('Escribe un celular peruano de 9 dígitos.');
}

export async function requestCustomerCode(channel: CustomerAuthChannel, input: string) {
  const identity = normalizeCustomerIdentity(channel, input);
  const config = getSupabaseConfig();
  if (!config) throw new Error('No se pudo conectar con Cogana.');
  const response = await fetch(`${config.url}/auth/v1/settings`, {
    headers: { apikey: config.publishableKey },
  });
  if (!response.ok) throw new Error('No pudimos consultar el acceso. Reintenta.');
  const settings = await response.json();
  if (settings.external?.[channel] !== true)
    throw new Error(
      channel === 'phone'
        ? 'El acceso por SMS aún no está disponible. Puedes ingresar con tu correo.'
        : 'El acceso por correo aún no está disponible.',
    );
  const { error } = await getCustomerAuthClient().auth.signInWithOtp(
    channel === 'email'
      ? { email: identity, options: { shouldCreateUser: true } }
      : { phone: identity, options: { shouldCreateUser: true, channel: 'sms' } },
  );
  if (error)
    throw new Error(
      error.status === 429
        ? 'Espera un momento antes de pedir otro código.'
        : 'No pudimos enviar el código. Revisa tus datos e inténtalo de nuevo.',
    );
  return identity;
}

export async function verifyCustomerCode(
  channel: CustomerAuthChannel,
  identity: string,
  token: string,
) {
  if (!/^\d{6,8}$/.test(token.trim())) throw new Error('Escribe el código que recibiste.');
  const { error } = await getCustomerAuthClient().auth.verifyOtp(
    channel === 'email'
      ? { email: identity, token: token.trim(), type: 'email' }
      : { phone: identity, token: token.trim(), type: 'sms' },
  );
  if (error) throw new Error('El código no es válido o venció. Revísalo o solicita otro.');
}
