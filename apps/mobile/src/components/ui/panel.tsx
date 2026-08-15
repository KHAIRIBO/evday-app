import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors, Radii } from '@/constants/theme';

type PanelProps = ViewProps & { variant?: 'default' | 'lime' };

export function Panel({ style, variant = 'default', ...rest }: PanelProps) {
  return <View style={[styles.base, variant === 'lime' && styles.lime, style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.panelBorder,
    borderRadius: Radii.xxl,
    padding: 15,
  },
  lime: {
    backgroundColor: Colors.lime,
    borderColor: Colors.lime,
  },
});
