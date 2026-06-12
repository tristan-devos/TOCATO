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
    background: '#F7F8FA',
    card: '#FFFFFF',
    backgroundElement: '#EEF1F5',
    backgroundSelected: '#E3E8EF',
    border: '#E5E9F0',

    // Texte
    text: '#0F172A',
    textSecondary: '#64748B',
    textInverse: '#FFFFFF',

    // Marque
    primary: '#2563EB',
    primaryPressed: '#1D4ED8',
    primaryMuted: '#EAF1FE',
    onPrimary: '#FFFFFF',

    // États
    success: '#16A34A',
    successMuted: '#E8F7EE',
    warning: '#D97706',
    warningMuted: '#FDF3E3',
    destructive: '#DC2626',
    destructiveMuted: '#FDEAEA',
};

export type ThemeColors = { readonly [K in keyof typeof light]: string };
export type ThemeColor = keyof ThemeColors;

const dark: ThemeColors = {
    // Surfaces
    background: '#0B1120',
    card: '#151C2C',
    backgroundElement: '#1E2638',
    backgroundSelected: '#2A3349',
    border: '#27304A',

    // Texte
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textInverse: '#0F172A',

    // Marque
    primary: '#3B82F6',
    primaryPressed: '#60A5FA',
    primaryMuted: '#1B2A4A',
    onPrimary: '#FFFFFF',

    // États
    success: '#4ADE80',
    successMuted: '#143323',
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
