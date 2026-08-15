import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store's web target is an empty stub in this SDK — calling
// getItemAsync() there throws ("getValueWithKeyAsync is not a function"),
// not a graceful no-op. That's not really a gap worth working around for
// production: there's no OS keychain on web, so a "secure" store there
// would be fiction either way, and neither passcode-lock nor biometrics
// are real concepts in a browser. This wrapper exists so `pnpm web` stays
// useful for quick UI iteration — localStorage on web, unencrypted, dev
// convenience only. Every real device build (iOS/Android) uses actual
// SecureStore, backed by Keychain/Keystore, unchanged.
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
