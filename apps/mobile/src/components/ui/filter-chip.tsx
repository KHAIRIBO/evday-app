import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Fonts, Radii } from '@/constants/theme';

type FilterChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: Colors.chipBorder,
  },
  chipActive: {
    backgroundColor: Colors.lime,
    borderColor: Colors.lime,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
  labelActive: {
    color: Colors.limeText,
  },
});
