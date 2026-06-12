import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const colors = useTheme();

  return (
    <View style={styles.base}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>{icon}</View>
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
  centered: { textAlign: 'center' },
  action: { marginTop: Spacing.three },
});
