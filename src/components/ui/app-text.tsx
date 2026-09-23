import { StyleSheet, Text, type TextProps } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'title' | 'heading' | 'subheading' | 'body' | 'secondary' | 'small' | 'label';

interface AppTextProps extends TextProps {
  variant?: Variant;
  /** Couleur explicite : sinon dérivée du variant */
  color?: string;
}

export function AppText({ variant = 'body', color, style, ...rest }: AppTextProps) {
  const colors = useTheme();
  const secondary = variant === 'secondary' || variant === 'small';
  return (
    <Text
      style={[styles[variant], { color: color ?? (secondary ? colors.textSecondary : colors.text) }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: FontSize.xxl, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.3 },
  subheading: { fontSize: FontSize.lg, fontWeight: '600' },
  body: { fontSize: FontSize.base },
  secondary: { fontSize: FontSize.sm, lineHeight: 20 },
  small: { fontSize: FontSize.xs },
  label: { fontSize: FontSize.sm, fontWeight: '600' },
});
