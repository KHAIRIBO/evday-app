import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconFolder } from '@/components/icon';
import { PasscodeDots } from '@/components/ui/dots';
import { Keypad } from '@/components/ui/keypad';
import { useSession } from '@/stores/session';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

const PASSCODE_LENGTH = 4;

export default function PasscodeSetupScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<'create' | 'confirm'>('create');
  const [first, setFirst] = useState('');
  const [digits, setDigits] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleDigit(d: string) {
    if (digits.length >= PASSCODE_LENGTH) return;
    const next = digits + d;
    setDigits(next);
    if (next.length !== PASSCODE_LENGTH) return;

    if (stage === 'create') {
      setTimeout(() => {
        setFirst(next);
        setDigits('');
        setStage('confirm');
      }, 200);
      return;
    }

    // confirm stage
    if (next === first) {
      setTimeout(async () => {
        await useSession.getState().setPasscode(next);
        router.replace('/(tabs)');
      }, 200);
    } else {
      setError('Passcodes didn’t match — try again');
      setTimeout(() => {
        setFirst('');
        setDigits('');
        setStage('create');
      }, 400);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.badge}>
          <IconFolder size={24} color={Colors.limeText} strokeWidth={2} />
        </View>
        <Text style={styles.title}>{stage === 'create' ? 'Create a\npasscode' : 'Confirm your\npasscode'}</Text>
        <Text style={styles.subtitle}>
          {stage === 'create'
            ? 'This locks the app locally — it never leaves your device.'
            : 'Enter it once more to confirm.'}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <PasscodeDots length={PASSCODE_LENGTH} filled={digits.length} />

      <View style={styles.keypadWrap}>
        <Keypad onDigit={handleDigit} onDelete={() => setDigits((d) => d.slice(0, -1))} showBiometric={false} />
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
  error: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.danger,
    marginTop: 10,
  },
  keypadWrap: {
    marginTop: 26,
  },
});
