import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconFolder, IconFingerprint } from '@/components/icon';
import { GhostButton, LimeButton } from '@/components/ui/buttons';
import { PasscodeDots } from '@/components/ui/dots';
import { Keypad } from '@/components/ui/keypad';
import { useSession } from '@/stores/session';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

const PASSCODE_LENGTH = 4;

export default function LoginScreen() {
  const router = useRouter();
  const hasStoredSession = useSession((s) => s.hasStoredSession);
  const hasPasscode = useSession((s) => s.hasPasscode);
  const [view, setView] = useState<'passcode' | 'touchid'>('passcode');
  const [digits, setDigits] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // No refresh token on this device at all — nothing to unlock. Straight
  // to the login screen (covers first-ever launch and post-logout).
  if (!hasStoredSession) return <Redirect href="/(auth)/signin" />;
  // A session exists but passcode setup never finished (app closed
  // mid-flow) — finish it before unlocking into the app.
  if (!hasPasscode) return <Redirect href="/(auth)/passcode-setup" />;

  async function unlockWithFreshSession() {
    setBusy(true);
    setError(null);
    try {
      const refreshToken = await useSession.getState().getRefreshToken();
      if (!refreshToken) throw new Error('no refresh token');
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error('refresh failed');
      const body = await res.json();
      await useSession.getState().setSession(body.data);
      router.replace('/(tabs)');
    } catch {
      // Refresh token expired/revoked server-side — the local passcode
      // can't vouch for a session that no longer exists remotely.
      await useSession.getState().clearSession();
      await useSession.getState().clearPasscode();
      setError('Your session expired — please sign in again');
      setTimeout(() => router.replace('/(auth)/signin'), 1200);
    } finally {
      setBusy(false);
    }
  }

  async function handleDigit(d: string) {
    if (digits.length >= PASSCODE_LENGTH || busy) return;
    const next = digits + d;
    setDigits(next);
    if (next.length !== PASSCODE_LENGTH) return;

    const ok = await useSession.getState().verifyPasscode(next);
    if (ok) {
      await unlockWithFreshSession();
    } else {
      setError('Wrong passcode');
      setTimeout(() => setDigits(''), 300);
    }
  }

  async function handleBiometric() {
    setView('touchid');
    setError(null);
    try {
      const LocalAuthentication = await import('expo-local-authentication');
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = hasHardware && (await LocalAuthentication.isEnrolledAsync());
      if (!enrolled) return; // screen already offers "Use passcode instead"
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Workspace' });
      if (result.success) {
        await unlockWithFreshSession();
      } else {
        setError('Touch ID failed — try again or use your passcode');
      }
    } catch {
      setError('Biometrics unavailable on this device');
    }
  }

  async function forgotPasscode() {
    await useSession.getState().clearPasscode();
    await useSession.getState().clearSession();
    router.replace('/(auth)/signin');
  }

  if (view === 'touchid') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.touchIdBody}>
          <Pressable style={styles.biometric} onPress={handleBiometric} disabled={busy}>
            <IconFingerprint size={46} color={Colors.lime} strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.touchIdTitle}>Touch ID</Text>
          <Text style={styles.touchIdSubtitle}>Place your finger on the sensor{'\n'}to unlock Workspace</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <GhostButton
            label="Use passcode instead"
            onPress={() => {
              setError(null);
              setView('passcode');
            }}
            style={{ marginTop: 30 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.badge}>
          <IconFolder size={24} color={Colors.limeText} strokeWidth={2} />
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Enter your 4-digit passcode or use Touch ID to unlock your workspace.</Text>
      </View>

      <PasscodeDots length={PASSCODE_LENGTH} filled={digits.length} />
      {error ? <Text style={styles.errorTextCenter}>{error}</Text> : null}

      <View style={styles.keypadWrap}>
        <Keypad onDigit={handleDigit} onDelete={() => setDigits((d) => d.slice(0, -1))} onBiometric={handleBiometric} />
      </View>

      <Pressable onPress={forgotPasscode}>
        <Text style={styles.forgot}>Forgot passcode?</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.ink,
    paddingHorizontal: Spacing.four - 6,
  },
  body: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  badge: {
    width: 46,
    height: 46,
    borderRadius: Radii.lg,
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 27,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    lineHeight: 19,
    color: Colors.textMuted,
    marginTop: 10,
  },
  keypadWrap: {
    marginTop: 26,
  },
  forgot: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.lime,
    textAlign: 'center',
    paddingVertical: 18,
  },
  errorText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.danger,
    textAlign: 'center',
    marginTop: 9,
  },
  errorTextCenter: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.danger,
    textAlign: 'center',
    marginTop: 12,
  },
  touchIdBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  biometric: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: 'rgba(216,243,74,0.4)',
    backgroundColor: 'rgba(216,243,74,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  touchIdTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 21,
    letterSpacing: -0.3,
    color: Colors.text,
  },
  touchIdSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    lineHeight: 19,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 9,
  },
});
