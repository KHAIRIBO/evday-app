import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { IconArrowRight, IconFolder } from '@/components/icon';
import { LimeButton } from '@/components/ui/buttons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  title: string;
  subtitle: string;
  linkPrompt: string;
  linkLabel: string;
  linkHref: '/(auth)/signin' | '/(auth)/signup';
};

/**
 * Shared by signin.tsx and signup.tsx — there's no separate backend call
 * for "login" vs "register" (requestCode always hits /register, which is
 * idempotent: existing email -> logs in, new email -> creates the
 * account). The two screens are a real UX distinction — different
 * copy/link, both landing on the same honest passwordless flow — not two
 * different code paths pretending to be one.
 */
export function EmailAuthForm({ title, subtitle, linkPrompt, linkLabel, linkHref }: Props) {
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
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

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

        <Pressable style={styles.linkRow} onPress={() => router.replace(linkHref)}>
          <Text style={styles.linkPrompt}>{linkPrompt} </Text>
          <Text style={styles.linkLabel}>{linkLabel}</Text>
        </Pressable>
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
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  linkPrompt: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  linkLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.lime,
  },
});
