/**
 * Khairibo app theme — fixed dark palette (lime / ink / panel), matching
 * the product design (claude.ai/design "Personal Workspace App - Modern
 * Design"). Not a light/dark adaptive theme — this look is the product.
 */

export const Colors = {
  ink: '#121212',
  panel: '#1c1c1c',
  panelBorder: 'rgba(255,255,255,0.08)',
  panelBorderSoft: 'rgba(255,255,255,0.07)',
  tabbar: '#171717',

  lime: '#d8f34a',
  limeText: '#131313',
  limeSoft: 'rgba(216,243,74,0.12)',
  limeSoftBorder: 'rgba(216,243,74,0.28)',

  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.5)',
  textFaint: 'rgba(255,255,255,0.4)',
  textGhost: 'rgba(255,255,255,0.3)',

  chipBg: 'rgba(255,255,255,0.07)',
  chipBorder: 'rgba(255,255,255,0.1)',
  fieldBg: '#1c1c1c',
  fieldBorder: 'rgba(255,255,255,0.1)',

  danger: '#ec3013',
} as const;

export type ColorToken = keyof typeof Colors;

export const Fonts = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semiBold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extraBold: 'Archivo_800ExtraBold',
  mono: 'ui-monospace, Menlo, monospace',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 15,
  xl: 16,
  xxl: 20,
  pill: 999,
} as const;

export const BottomTabInset = 0;
export const MaxContentWidth = 480;
