import { Redirect } from 'expo-router';

import { useSession } from '@/stores/session';

/**
 * Nothing else in the app matches the bare "/" path — (auth) and (tabs)
 * are sibling groups, neither owns the root by default, so without this
 * file a cold launch had no route to resolve and would land on Expo
 * Router's unmatched-route screen instead of ever reaching login.
 *
 * accessToken is memory-only (cleared on every restart, by design — see
 * stores/session.ts), so a returning user always lands on /(auth)/login
 * here; login.tsx itself decides whether that means "enter your
 * passcode/Touch ID" or "sign in with email" based on what's actually
 * stored on the device. Mirrors the same gate (tabs)/_layout.tsx uses.
 */
export default function Index() {
  const accessToken = useSession((s) => s.accessToken);
  return <Redirect href={accessToken ? '/(tabs)' : '/(auth)/login'} />;
}
