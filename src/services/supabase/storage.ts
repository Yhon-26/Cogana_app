import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// The web preview uses memory only. Native sessions use the OS credential store.
const previewStorage = new Map<string, string>();
export const sessionStorage = {
  getItem: (key: string): Promise<string | null> =>
    Platform.OS === 'web'
      ? Promise.resolve(previewStorage.get(key) ?? null)
      : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      previewStorage.set(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      previewStorage.delete(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};
