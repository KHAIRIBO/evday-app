import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Colors, Fonts, Radii } from '@/constants/theme';

type ButtonProps = PressableProps & { label: string; icon?: ReactNode; children?: ReactNode };

export function LimeButton({ label, icon, children, style, disabled, ...rest }: ButtonProps) {
  return (
    <Pressable
      style={(state) => [styles.lime, disabled && styles.disabled, typeof style === 'function' ? style(state) : style]}
      disabled={disabled}
      {...rest}>
      <Text style={styles.limeLabel}>{label}</Text>
      {icon ?? children}
    </Pressable>
  );
}

export function GhostButton({ label, icon, children, style, disabled, ...rest }: ButtonProps) {
  return (
    <Pressable
      style={(state) => [styles.ghost, disabled && styles.disabled, typeof style === 'function' ? style(state) : style]}
      disabled={disabled}
      {...rest}>
      <Text style={styles.ghostLabel}>{label}</Text>
      {icon ?? children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lime: {
    height: 50,
    borderRadius: Radii.xl,
    backgroundColor: Colors.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    width: '100%',
  },
  limeLabel: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.limeText,
  },
  ghost: {
    height: 50,
    borderRadius: Radii.xl,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  ghostLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  disabled: {
    opacity: 0.45,
  },
});
