// Design System Tokens
export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  10: '48px',
  12: '64px',
} as const;

export const typography = {
  sm: { size: '14px', lineHeight: '1.43' }, // 20px height
  base: { size: '16px', lineHeight: '1.5' }, // 24px height
  lg: { size: '20px', lineHeight: '1.4' }, // 28px height
  xl: { size: '24px', lineHeight: '1.33' }, // 32px height
  '2xl': { size: '32px', lineHeight: '1.25' }, // 40px height
  '3xl': { size: '48px', lineHeight: '1.17' }, // 56px height
} as const;

export const fontWeights = {
  regular: 400,
  semibold: 600,
  bold: 700,
  black: 900,
} as const;

export const colors = {
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F7F7F8',
  backgroundTertiary: '#F0F0F1',

  // Text
  text: '#111111',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',

  // Accents
  primary: '#0053DB', // Blue
  primaryLight: '#2563EB',
  primaryDark: '#003D99',

  // States
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  error: '#D32F2F',  // Red

  // Borders & dividers
  border: '#E5E5E5',
  borderSecondary: '#D0D0D0',
  divider: '#E5E5E5',

  // Surface
  surface: '#FFFFFF',
  surfaceHover: '#F7F7F8',
  surfaceActive: '#F0F0F1',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
} as const;

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
  md: '0 4px 12px rgba(0, 0, 0, 0.10)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
  xl: '0 12px 32px rgba(0, 0, 0, 0.15)',
} as const;

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
} as const;

export const breakpoints = {
  mobile: '375px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
} as const;

// Contrast ratios (WCAG AA minimum: 4.5:1)
export const wcag = {
  textOnBackground: '16.68:1', // #111111 on #FFFFFF
  textSecondaryOnBackground: '5.73:1', // #666666 on #FFFFFF
  primaryOnWhite: '8.6:1', // #0053DB on #FFFFFF
} as const;
