import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Fonts, Radii } from '@/constants/theme';

type OtpInputProps = {
  length: number;
  value: string;
  onChange: (value: string) => void;
};

export function OtpInput({ length, value, onChange }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);

  return (
    <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
      {Array.from({ length }).map((_, i) => {
        const filled = i < value.length;
        const cursor = i === value.length;
        return (
          <View key={i} style={[styles.box, (filled || cursor) && styles.boxActive]}>
            <Text style={styles.digit}>{filled ? value[i] : cursor ? '|' : ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        autoFocus
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  box: {
    flex: 1,
    height: 54,
    borderRadius: Radii.lg,
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.fieldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: 'rgba(216,243,74,0.5)',
  },
  digit: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});
