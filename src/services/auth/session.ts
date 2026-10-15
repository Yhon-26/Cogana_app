import { AppState, Platform } from 'react-native';
import { getSupabaseClient } from '../supabase/client';
import { getCustomerAuthClient } from '../customer/auth';

// No sign-in is performed by startup. Activate refresh only while the native app is foregrounded.
export function startSessionLifecycle(): () => void {
  const client = getSupabaseClient();
  if (!client || Platform.OS === 'web') return () => undefined;
  const clients = [client, getCustomerAuthClient()];
  if (AppState.currentState === 'active')
    clients.forEach((item) => void item.auth.startAutoRefresh());
  const subscription = AppState.addEventListener('change', (state) => {
    clients.forEach((item) => {
      if (state === 'active') void item.auth.startAutoRefresh();
      else void item.auth.stopAutoRefresh();
    });
  });
  return () => {
    subscription.remove();
    clients.forEach((item) => void item.auth.stopAutoRefresh());
  };
}
