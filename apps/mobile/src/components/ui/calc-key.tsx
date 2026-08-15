import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Fonts, Radii } from '@/constants/theme';

type CalcKeyProps = {
  label: string;
  variant?: 'default' | 'op' | 'eq' | 'fn';
  onPress?: () => void;
};

export function CalcKey({ label, variant = 'default', onPress }: CalcKeyProps) {
  return (
    <Pressable
      style={[styles.key, variant === 'op' && styles.op, variant === 'eq' && styles.eq]}
      onPress={onPress}>
      <Text style={[styles.label, variant === 'op' && styles.labelOp, variant === 'eq' && styles.labelEq, variant === 'fn' && styles.labelFn]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  key: {
    flexBasis: '23%',
    flexGrow: 1,
    height: 58,
    borderRadius: Radii.xxl - 1,
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.panelBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  op: {
    backgroundColor: 'rgba(216,243,74,0.13)',
    borderColor: 'rgba(216,243,74,0.28)',
  },
  eq: {
    backgroundColor: Colors.lime,
    borderColor: Colors.lime,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 19,
    color: Colors.text,
  },
  labelOp: {
    color: Colors.lime,
  },
  labelEq: {
    color: Colors.limeText,
  },
  labelFn: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.55)',
  },
});
