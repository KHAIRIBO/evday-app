import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii } from '@/constants/theme';

import { IconChevronRight, IconMoreVertical } from '../icon';

type ListItemProps = {
  icon: ReactNode;
  solid?: boolean;
  name: string;
  meta: string;
  trailing?: 'chevron' | 'kebab';
  onPress?: () => void;
  /** Long-press anywhere on the row — kept as a fallback gesture. */
  onLongPress?: () => void;
  /** Tapping the kebab icon itself, when trailing="kebab" — the more
   * discoverable of the two ways to reach the same action sheet. Its own
   * nested Pressable, so it doesn't also fire the row's onPress. */
  onKebabPress?: () => void;
};

export function ListItem({ icon, solid, name, meta, trailing = 'chevron', onPress, onLongPress, onKebabPress }: ListItemProps) {
  return (
    <Pressable style={styles.row} onPress={onPress} onLongPress={onLongPress}>
      <View style={[styles.thumb, solid && styles.thumbSolid]}>{icon}</View>
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      {trailing === 'chevron' ? (
        <IconChevronRight />
      ) : onKebabPress ? (
        <Pressable onPress={onKebabPress} hitSlop={10} style={styles.kebabHit}>
          <IconMoreVertical />
        </Pressable>
      ) : (
        <IconMoreVertical />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.panelBorderSoft,
    borderRadius: Radii.xl,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbSolid: {
    backgroundColor: Colors.lime,
  },
  text: {
    flex: 1,
  },
  name: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.text,
  },
  meta: {
    fontFamily: Fonts.medium,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  kebabHit: {
    padding: 4,
  },
});
