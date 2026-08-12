export const colors = {
  primary: {
    50: '#fef7ee',
    100: '#fdedd6',
    200: '#fad7ad',
    300: '#f6ba79',
    400: '#f19342',
    500: '#ed751e',
    600: '#de5c14',
    700: '#b84613',
    800: '#923917',
    900: '#763015',
    950: '#401709',
  },
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  info: '#2563eb',
  background: '#ffffff',
  surface: '#f9fafb',
  muted: '#6b7280',
  border: '#e5e7eb',
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    inverse: '#ffffff',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export type Colors = typeof colors;
