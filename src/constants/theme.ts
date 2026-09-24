/**
 * Design tokens TOCATO.
 *
 * Toutes les couleurs existent en mode clair et sombre avec les mêmes clés.
 * Accès via le hook `useTheme()` (src/hooks/use-theme.ts).
 */

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

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

    // Accent chaud : moments positifs (note, célébration). Icônes et aplats,
    // pas du texte courant (contraste 3:1 visé, pas 4.5:1).
    accent: '#B97A10',
    accentMuted: '#FBF0DA',
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

    accent: '#F2B544',
    accentMuted: '#33291A',
};

export const Colors: { light: ThemeColors; dark: ThemeColors } = { light, dark };

/**
 * Police de l'app (Plus Jakarta Sans, @expo-google-fonts), chargée dans
 * app/_layout.tsx avant le retrait de l'écran de démarrage. Une famille par
 * graisse : ne jamais combiner avec `fontWeight` (Android simulerait le gras).
 */
export const FONT_FILES = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
};

export const Font = {
  regular: { fontFamily: 'PlusJakartaSans_400Regular' },
  medium: { fontFamily: 'PlusJakartaSans_500Medium' },
  semibold: { fontFamily: 'PlusJakartaSans_600SemiBold' },
  bold: { fontFamily: 'PlusJakartaSans_700Bold' },
  extrabold: { fontFamily: 'PlusJakartaSans_800ExtraBold' },
} as const;

/**
 * Élévation : ombre douce en clair ; en sombre une ombre ne se voit pas, la
 * carte garde sa bordure (voir Card). `boxShadow` est pris en charge par iOS,
 * Android et le web (nouvelle architecture).
 */
export const Elevation = {
  light: {
    sm: '0px 1px 2px rgba(26, 26, 18, 0.05), 0px 2px 8px rgba(26, 26, 18, 0.06)',
    md: '0px 2px 4px rgba(26, 26, 18, 0.06), 0px 8px 24px rgba(26, 26, 18, 0.10)',
  },
  dark: { sm: 'none', md: 'none' },
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
  display: 34,
} as const;

export const MaxContentWidth = 800;
