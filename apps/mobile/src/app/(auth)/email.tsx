import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { IconArrowRight, IconFolder } from '@/components/icon';
import { LimeButton } from '@/components/ui/buttons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Not in the original mockup — the design jumped straight from "Create an
// account" to a pre-filled OTP screen. An email has to come from
// somewhere real; this is that missing step, built in the same visual
// language as the rest of the auth flow.
export default function EmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = EMAIL_RE.test(email.trim());

  async function submit() {
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    try {
      await authApi.requestCode(email.trim());
      router.push({ pathname: '/(auth)/verify', params: { email: email.trim() } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send a code — check your connection');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.badge}>
          <IconFolder size={24} color={Colors.limeText} strokeWidth={2} />
        </View>
        <Text style={styles.title}>Sign in or{'\n'}create an account</Text>
        <Text style={styles.subtitle}>Enter your email — we’ll send a 6-digit code, no password needed.</Text>

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            onSubmitEditing={submit}
            returnKeyType="send"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <LimeButton label={loading ? 'Sending…' : 'Continue'} onPress={submit} disabled={!valid || loading}>
          <IconArrowRight size={18} />
        </LimeButton>
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
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  badge: {
    width: 46,
    height: 46,
    borderRadius: Radii.lg,
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
  },
  fieldWrap: {
    marginTop: Spacing.two,
  },
  fieldLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 7,
  },
  input: {
    height: 48,
    borderRadius: Radii.lg,
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.fieldBorder,
    color: Colors.text,
    paddingHorizontal: 14,
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  error: {
    fontFamily: Fonts.medium,
    fontSize: 11.5,
    color: Colors.danger,
  },
});
