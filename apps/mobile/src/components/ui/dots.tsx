import { StyleSheet, View } from 'react-native';

type PasscodeDotsProps = {
  length: number;
  filled: number;
};

export function PasscodeDots({ length, filled }: PasscodeDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, i) => (
        <View key={i} style={[styles.dot, i < filled && styles.dotFill]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dotFill: {
    backgroundColor: '#d8f34a',
    borderColor: '#d8f34a',
  },
});
