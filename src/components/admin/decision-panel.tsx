import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DecisionResult } from '@/lib/admin-store';

interface DecisionPanelProps {
  approveLabel: string;
  confirmTitle: string;
  confirmMessage: string;
  rejectPlaceholder: string;
  onApprove: () => Promise<DecisionResult>;
  onReject: (reason: string) => Promise<DecisionResult>;
}

/**
 * Décision de l'admin sur ce qui attend (demande d'adhésion, photo) : approuver
 * (confirmation) ou refuser (motif obligatoire, visible par le prestataire).
 */
export function DecisionPanel({
  approveLabel,
  confirmTitle,
  confirmMessage,
  rejectPlaceholder,
  onApprove,
  onReject,
}: DecisionPanelProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (kind: 'approve' | 'reject', action: () => Promise<DecisionResult>) => {
    setBusy(kind);
    setError(null);
    const result = await action();
    setBusy(null);
    if (result.error) {
      setError(t(`admin.errors.${result.error}`, { defaultValue: t('admin.errors.generic') }));
    }
  };

  const confirmApprove = () =>
    Alert.alert(confirmTitle, confirmMessage, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: approveLabel, onPress: () => void run('approve', onApprove) },
    ]);

  return (
    <Card style={styles.card}>
      <Button
        title={approveLabel}
        onPress={confirmApprove}
        loading={busy === 'approve'}
        disabled={busy !== null}
      />
      <View style={styles.reject}>
        <TextField
          label={t('admin.rejectReason')}
          value={reason}
          onChangeText={setReason}
          placeholder={rejectPlaceholder}
          multiline
        />
        <Button
          title={t('admin.reject')}
          onPress={() => void run('reject', () => onReject(reason))}
          variant="destructive"
          loading={busy === 'reject'}
          disabled={busy !== null || reason.trim().length === 0}
        />
      </View>
      {error ? (
        <AppText variant="secondary" color={colors.destructive}>
          {error}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.four },
  reject: { gap: Spacing.two },
});
