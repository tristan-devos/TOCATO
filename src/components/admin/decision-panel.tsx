import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAdminStore, type DecisionResult } from '@/lib/admin-store';
import type { AdminApplication } from '@/lib/types';

/** Décision sur une demande en attente : approuver (confirmation) ou refuser (motif). */
export function DecisionPanel({ application }: { application: AdminApplication }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const approve = useAdminStore((s) => s.approve);
  const reject = useAdminStore((s) => s.reject);
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
    Alert.alert(
      t('admin.approveTitle'),
      t('admin.approveMessage', { name: application.businessName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.approve'),
          onPress: () => void run('approve', () => approve(application.id)),
        },
      ],
    );

  return (
    <Card style={styles.card}>
      <Button
        title={t('admin.approve')}
        onPress={confirmApprove}
        loading={busy === 'approve'}
        disabled={busy !== null}
      />
      <View style={styles.reject}>
        <TextField
          label={t('admin.rejectReason')}
          value={reason}
          onChangeText={setReason}
          placeholder={t('admin.rejectPlaceholder')}
          multiline
        />
        <Button
          title={t('admin.reject')}
          onPress={() => void run('reject', () => reject(application.id, reason))}
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
