import { StyleSheet, Text, type TextProps } from 'react-native';

import { Font, FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'secondary'
  | 'small'
  | 'label';

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
  // Grand titre d'accueil (salutation) : la voix de l'app.
  display: { ...Font.extrabold, fontSize: FontSize.display, lineHeight: 40, letterSpacing: -0.8 },
  title: { ...Font.extrabold, fontSize: FontSize.xxl, letterSpacing: -0.5 },
  heading: { ...Font.bold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  subheading: { ...Font.bold, fontSize: FontSize.lg },
  body: { ...Font.regular, fontSize: FontSize.base },
  secondary: { ...Font.regular, fontSize: FontSize.sm, lineHeight: 20 },
  small: { ...Font.regular, fontSize: FontSize.xs },
  label: { ...Font.semibold, fontSize: FontSize.sm },
});
