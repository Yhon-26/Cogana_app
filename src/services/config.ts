// Expo only inlines direct EXPO_PUBLIC references. These values are public client configuration.
export function getSupabaseConfig() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) return null;
  if (!url.startsWith('https://') || !publishableKey.startsWith('sb_publishable_')) {
    throw new Error('Usa una URL HTTPS y una clave pública sb_publishable_ de Supabase.');
  }
  return { url, publishableKey };
}
