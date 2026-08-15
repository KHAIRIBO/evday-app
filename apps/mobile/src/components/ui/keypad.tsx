import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii } from '@/constants/theme';

import { IconDelete, IconFingerprint } from '../icon';

type KeypadProps = {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onBiometric?: () => void;
  showBiometric?: boolean;
};

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function Keypad({ onDigit, onDelete, onBiometric, showBiometric = true }: KeypadProps) {
  return (
    <View style={styles.grid}>
      {DIGITS.map((d) => (
        <Pressable key={d} style={styles.key} onPress={() => onDigit(d)}>
          <Text style={styles.keyLabel}>{d}</Text>
        </Pressable>
      ))}
      {showBiometric ? (
        <Pressable style={styles.ghostKey} onPress={onBiometric}>
          <IconFingerprint size={26} color={Colors.lime} strokeWidth={1.7} />
        </Pressable>
      ) : (
        <View style={styles.ghostKey} />
      )}
      <Pressable style={styles.key} onPress={() => onDigit('0')}>
        <Text style={styles.keyLabel}>0</Text>
      </Pressable>
      <Pressable style={styles.ghostKey} onPress={onDelete}>
        <IconDelete size={24} color="#fff" strokeWidth={1.8} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  key: {
    width: '30%',
    height: 62,
    borderRadius: Radii.xxl,
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.panelBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    color: Colors.text,
  },
  ghostKey: {
    width: '30%',
    height: 62,
    borderRadius: Radii.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
