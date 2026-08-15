import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii } from '@/constants/theme';

type ChatBubbleProps = {
  from: 'ai' | 'me';
  children: ReactNode;
};

export function ChatBubble({ from, children }: ChatBubbleProps) {
  return (
    <View style={[styles.base, from === 'ai' ? styles.ai : styles.me]}>
      {typeof children === 'string' ? <Text style={[styles.text, from === 'me' && styles.textMe]}>{children}</Text> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    maxWidth: '84%',
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 17,
  },
  ai: {
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.panelBorder,
    borderBottomLeftRadius: 6,
    alignSelf: 'flex-start',
  },
  me: {
    backgroundColor: Colors.lime,
    borderBottomRightRadius: 6,
    alignSelf: 'flex-end',
  },
  text: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.text,
  },
  textMe: {
    fontFamily: Fonts.medium,
    color: Colors.limeText,
  },
});

export function ChatFileChip({ name, size }: { name: string; size: string }) {
  return (
    <View style={chipStyles.row}>
      <Text style={chipStyles.name}>{name}</Text>
      <Text style={chipStyles.size}>{size}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.panelBorder,
    borderRadius: Radii.xl,
    maxWidth: '84%',
  },
  name: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: Colors.text,
  },
  size: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
});

export function ChatActionChip({ label, accent, onPress }: { label: string; accent?: boolean; onPress?: () => void }) {
  return (
    <Pressable style={[actionStyles.chip, accent && actionStyles.accent]} onPress={onPress}>
      <Text style={[actionStyles.label, accent && actionStyles.labelAccent]}>{label}</Text>
    </Pressable>
  );
}

const actionStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.md + 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  accent: {
    backgroundColor: Colors.limeSoft,
    borderColor: Colors.limeSoftBorder,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.6)',
  },
  labelAccent: {
    color: Colors.lime,
  },
});
