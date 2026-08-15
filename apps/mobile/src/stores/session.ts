import { create } from 'zustand';

import { secureStorage } from '@/lib/secure-storage';

// Real session store: refreshToken lives in SecureStore (OS keychain),
// accessToken lives only in memory and is re-acquired via /api/auth/refresh
// — matches architecture.md exactly ("Access token in memory, refresh
// token in expo-secure-store"). The passcode is a LOCAL lock on top of
// this, hashed (never the raw PIN) and never sent to the server.

const REFRESH_TOKEN_KEY = 'khairibo.refreshToken';
const PASSCODE_HASH_KEY = 'khairibo.passcodeHash';

export interface SessionUser {
  id: string;
  email: string;
}

interface SessionState {
  accessToken: string | null;
  user: SessionUser | null;
  hydrated: boolean;
  hasPasscode: boolean;
  hasStoredSession: boolean;

  hydrate: () => Promise<void>;
  setSession: (session: { accessToken: string; refreshToken: string; user: SessionUser }) => Promise<void>;
  setAccessToken: (token: string) => void;
  clearSession: () => Promise<void>;
  getRefreshToken: () => Promise<string | null>;

  setPasscode: (pin: string) => Promise<void>;
  verifyPasscode: (pin: string) => Promise<boolean>;
  clearPasscode: () => Promise<void>;
}

async function hashPin(pin: string): Promise<string> {
  const Crypto = await import('expo-crypto');
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export const useSession = create<SessionState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  hasPasscode: false,
  hasStoredSession: false,

  hydrate: async () => {
    const [passcodeHash, refreshToken] = await Promise.all([
      secureStorage.getItem(PASSCODE_HASH_KEY),
      secureStorage.getItem(REFRESH_TOKEN_KEY),
    ]);
    set({ hasPasscode: Boolean(passcodeHash), hasStoredSession: Boolean(refreshToken), hydrated: true });
  },

  setSession: async ({ accessToken, refreshToken, user }) => {
    await secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    set({ accessToken, user, hasStoredSession: true });
  },

  setAccessToken: (token) => set({ accessToken: token }),

  clearSession: async () => {
    await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
    set({ accessToken: null, user: null, hasStoredSession: false });
  },

  getRefreshToken: () => secureStorage.getItem(REFRESH_TOKEN_KEY),

  setPasscode: async (pin) => {
    await secureStorage.setItem(PASSCODE_HASH_KEY, await hashPin(pin));
    set({ hasPasscode: true });
  },

  verifyPasscode: async (pin) => {
    const stored = await secureStorage.getItem(PASSCODE_HASH_KEY);
    if (!stored) return false;
    return (await hashPin(pin)) === stored;
  },

  clearPasscode: async () => {
    await secureStorage.deleteItem(PASSCODE_HASH_KEY);
    set({ hasPasscode: false });
  },
}));
