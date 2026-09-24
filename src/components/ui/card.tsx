import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useElevation, useTheme } from '@/hooks/use-theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Surface de base, coins arrondis : ombre douce en clair, bordure fine en sombre
 * (une ombre ne se voit pas sur fond sombre). Pressable : se contracte au toucher.
 */
export function Card({ children, onPress, style }: CardProps) {
  const colors = useTheme();
  const elevation = useElevation();
  const dark = useColorScheme() === 'dark';
  const surface: ViewStyle = dark
    ? { backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }
    : { backgroundColor: colors.card, boxShadow: elevation.sm };

  if (!onPress) {
    return <View style={[styles.base, surface, style]}>{children}</View>;
  }
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={[styles.base, surface, style]}>
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
});
