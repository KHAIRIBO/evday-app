import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Fonts, Radii } from '@/constants/theme';

type QuickActionProps = {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
};

export function QuickAction({ icon, label, onPress }: QuickActionProps) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      {icon}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.panelBorderSoft,
    borderRadius: Radii.xl,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.72)',
  },
});
