import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  /** Icône affichée avant le titre */
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
}: ButtonProps) {
  const colors = useTheme();

  const palette: Record<Variant, { bg: string; bgPressed: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, bgPressed: colors.primaryPressed, fg: colors.onPrimary },
    secondary: { bg: colors.primaryMuted, bgPressed: colors.backgroundSelected, fg: colors.primary },
    outline: {
      bg: 'transparent',
      bgPressed: colors.backgroundElement,
      fg: colors.text,
      border: colors.border,
    },
    ghost: { bg: 'transparent', bgPressed: colors.backgroundElement, fg: colors.primary },
    destructive: { bg: colors.destructiveMuted, bgPressed: colors.destructiveMuted, fg: colors.destructive },
  };
  const { bg, bgPressed, fg, border } = palette[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: pressed ? bgPressed : bg,
          borderColor: border,
          borderWidth: border ? StyleSheet.hairlineWidth : 0,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, size === 'lg' && styles.labelLg, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
  },
  label: { fontSize: FontSize.sm, fontWeight: '600' },
  labelLg: { fontSize: FontSize.base },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, minHeight: 36 },
  md: { paddingVertical: 12, paddingHorizontal: Spacing.four, minHeight: 46 },
  lg: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.four, minHeight: 54 },
});
