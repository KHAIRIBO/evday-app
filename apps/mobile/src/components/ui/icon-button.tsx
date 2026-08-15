import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Colors, Radii } from '@/constants/theme';

type IconButtonProps = PressableProps & { children: ReactNode; accent?: boolean };

export function IconButton({ children, accent, style, ...rest }: IconButtonProps) {
  return (
    <Pressable
      style={(state) => [styles.base, accent && styles.accent, typeof style === 'function' ? style(state) : style]}
      {...rest}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 38,
    height: 38,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accent: {
    backgroundColor: Colors.lime,
    borderColor: Colors.lime,
  },
});
