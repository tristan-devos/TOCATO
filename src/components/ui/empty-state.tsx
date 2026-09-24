import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface EmptyStateProps {
  /** Petite icône dans un cercle ; ignorée si `illustration` est fournie. */
  icon?: ReactNode;
  /** Illustration (components/illustrations) : états vides des écrans principaux. */
  illustration?: ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** État vide qui encourage : illustration ou icône, titre, message, action. */
export function EmptyState({
  icon,
  illustration,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colors = useTheme();

  return (
    <View style={styles.base}>
      {illustration ? (
        <View style={styles.illustration}>{illustration}</View>
      ) : icon ? (
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>{icon}</View>
      ) : null}
      <AppText variant="subheading" style={styles.centered}>
        {title}
      </AppText>
      <AppText variant="secondary" style={styles.centered}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.five,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  illustration: { marginBottom: Spacing.two },
  centered: { textAlign: 'center' },
  action: { marginTop: Spacing.three },
});
