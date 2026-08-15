import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii } from '@/constants/theme';

type SegmentedControlProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <View style={styles.seg}>
      {options.map((opt) => {
        const on = opt === value;
        return (
          <Pressable key={opt} style={[styles.opt, on && styles.optOn]} onPress={() => onChange(opt)}>
            <Text style={[styles.label, on && styles.labelOn]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radii.xl,
  },
  opt: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: Radii.md,
  },
  optOn: {
    backgroundColor: Colors.lime,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  labelOn: {
    color: Colors.limeText,
  },
});
