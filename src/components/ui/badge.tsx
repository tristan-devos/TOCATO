import { StyleSheet, Text, View } from 'react-native';

import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Tone = 'primary' | 'success' | 'warning' | 'destructive' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: Tone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const colors = useTheme();

  const palette: Record<Tone, { bg: string; fg: string }> = {
    primary: { bg: colors.primaryMuted, fg: colors.primary },
    success: { bg: colors.successMuted, fg: colors.success },
    warning: { bg: colors.warningMuted, fg: colors.warning },
    destructive: { bg: colors.destructiveMuted, fg: colors.destructive },
    neutral: { bg: colors.backgroundElement, fg: colors.textSecondary },
  };
  const { bg, fg } = palette[tone];

  return (
    <View style={[styles.base, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  label: { fontSize: FontSize.xs, fontWeight: '600' },
});
