import { Colors, Elevation, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark : Colors.light;
}

/** Ombres du mode actif (`boxShadow`) : aucune en sombre. */
export function useElevation(): (typeof Elevation)[keyof typeof Elevation] {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Elevation.dark : Elevation.light;
}
