import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

import { Panel } from './panel';

type StatCardProps = {
  icon: ReactNode;
  delta: string;
  deltaPositive?: boolean;
  value: string;
  label: string;
};

export function StatCard({ icon, delta, deltaPositive = true, value, label }: StatCardProps) {
  return (
    <Panel style={styles.panel}>
      <View style={styles.top}>
        {icon}
        <Text style={[styles.delta, !deltaPositive && styles.deltaDim]}>{delta}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  delta: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(216,243,74,0.16)',
    color: Colors.lime,
    overflow: 'hidden',
  },
  deltaDim: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.6)',
  },
  value: {
    fontFamily: Fonts.extraBold,
    fontSize: 24,
    lineHeight: 24,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 5,
  },
});
