import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';
import { getSupabaseConfig } from '../config';
import { sessionStorage } from './storage';

let client: SupabaseClient<Database> | undefined;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (client) return client;
  const config = getSupabaseConfig();
  if (!config) return null;
  client = createClient<Database>(config.url, config.publishableKey, {
    auth: {
      storage: sessionStorage,
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}
