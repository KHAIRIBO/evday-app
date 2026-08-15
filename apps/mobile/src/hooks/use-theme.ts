import { Colors } from '@/constants/theme';

// The product design is a single fixed dark theme (ink / panel / lime) —
// not adaptive to the system color scheme.
export function useTheme() {
  return Colors;
}
