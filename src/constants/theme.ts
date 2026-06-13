/**
 * Design tokens TOCATO.
 *
 * Toutes les couleurs existent en mode clair et sombre avec les mêmes clés.
 * Accès via le hook `useTheme()` (src/hooks/use-theme.ts).
 */

import '@/global.css';

import { Platform } from 'react-native';

const light = {
    // Surfaces
    background: '#F6F3EC',
    card: '#FDFBF6',
    backgroundElement: '#EDE8DC',
    backgroundSelected: '#E2DBCC',
    border: '#D8D1C0',

    // Texte
    text: '#1A1A12',
    textSecondary: '#6B6555',
    textInverse: '#FDFBF6',

    // Marque
    primary: '#1C6B3E',
    primaryPressed: '#145530',
    primaryMuted: '#E4F0E9',
    onPrimary: '#FFFFFF',

    // États
    success: '#16A34A',
    successMuted: '#E4F0E9',
    warning: '#B45309',
    warningMuted: '#FDF3E3',
    destructive: '#DC2626',
    destructiveMuted: '#FDEAEA',
};

export type ThemeColors = { readonly [K in keyof typeof light]: string };
export type ThemeColor = keyof ThemeColors;

const dark: ThemeColors = {
    // Surfaces
    background: '#0D1710',
    card: '#132018',
    backgroundElement: '#1A2B1E',
    backgroundSelected: '#213626',
    border: '#2A3D2F',

    // Texte
    text: '#EDE8DC',
    textSecondary: '#8A9A8D',
    textInverse: '#1A1A12',

    // Marque
    primary: '#3AB869',
    primaryPressed: '#51CC7C',
    primaryMuted: '#132B1E',
    onPrimary: '#FFFFFF',

    // États
    success: '#4ADE80',
    successMuted: '#132B1E',
    warning: '#FBBF24',
    warningMuted: '#3A2E12',
    destructive: '#F87171',
    destructiveMuted: '#3B1A1A',
};

export const Colors: { light: ThemeColors; dark: ThemeColors } = { light, dark };

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export const MaxContentWidth = 800;
