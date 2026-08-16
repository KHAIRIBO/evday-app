import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { IconArrowLeft, IconArrowRight, IconLock } from '@/components/icon';
import { LimeButton } from '@/components/ui/buttons';
import { IconButton } from '@/components/ui/icon-button';
import { OtpInput } from '@/components/ui/otp-input';
import { useSession } from '@/stores/session';
import { Colors, Fonts, Spacing } from '@/constants/theme';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const visible = name.slice(0, 1);
  return `${visible}${'•'.repeat(Math.max(name.length - 1, 3))}@${domain}`;
}

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    timer.current = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer.current);
  }, []);

  useEffect(() => {
    if (code.length === CODE_LENGTH) void submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function submit() {
    if (!email || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const tokens = await authApi.verifyCode(email, code);
      await useSession.getState().setSession(tokens);
      const hasPasscode = useSession.getState().hasPasscode;
      router.replace(hasPasscode ? '/(tabs)' : '/(auth)/passcode-setup');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not verify — check your connection');
      setCode('');
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    if (!email || seconds > 0) return;
    setError(null);
    try {
      await authApi.requestCode(email);
      setSeconds(RESEND_SECONDS);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not resend — check your connection');
    }
  }

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <IconButton onPress={() => router.back()}>
          <IconArrowLeft size={19} />
        </IconButton>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Verify your{'\n'}email address</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to <Text style={styles.email}>{maskEmail(email ?? '')}</Text>
        </Text>

        <View style={styles.otpWrap}>
          <OtpInput length={CODE_LENGTH} value={code} onChange={setCode} />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>
            {seconds > 0 ? `Resend code in ${mins}:${secs}` : 'Didn’t get it?'}
          </Text>
          <Pressable onPress={resend} disabled={seconds > 0}>
            <Text style={[styles.changeEmail, seconds > 0 && styles.dimmed]}>
              {seconds > 0 ? '' : 'Resend code'}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.changeEmail}>Change email</Text>
          </Pressable>
        </View>

        <LimeButton
          label={submitting ? 'Verifying…' : 'Verify and continue'}
          onPress={submit}
          disabled={code.length < CODE_LENGTH || submitting}>
          <IconArrowRight size={18} />
        </LimeButton>

        <View style={styles.securityNote}>
          <IconLock size={15} />
          <Text style={styles.securityText}>
            Your session is protected end-to-end. We never store your passcode on our servers.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.ink,
    paddingHorizontal: Spacing.four - 6,
  },
  header: {
    flexDirection: 'row',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    lineHeight: 19,
    color: Colors.textMuted,
    marginTop: 10,
    marginBottom: 24,
  },
  email: {
    color: Colors.lime,
  },
  otpWrap: {
    marginBottom: 12,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 11.5,
    color: Colors.danger,
    marginBottom: 12,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  resendText: {
    fontFamily: Fonts.medium,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.45)',
  },
  changeEmail: {
    fontFamily: Fonts.semiBold,
    fontSize: 11.5,
    color: Colors.lime,
  },
  dimmed: {
    opacity: 0.5,
  },
  securityNote: {
    marginTop: 'auto',
    paddingBottom: 22,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
  },
  securityText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 10.5,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.4)',
  },
});
