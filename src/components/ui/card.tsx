import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Surface de base : fond carte, coins arrondis, bordure fine. */
export function Card({ children, onPress, style }: CardProps) {
  const colors = useTheme();
  const surface = { backgroundColor: colors.card, borderColor: colors.border };

  if (!onPress) {
    return <View style={[styles.base, surface, style]}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.base, surface, pressed && { opacity: 0.85 }, style]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
});
