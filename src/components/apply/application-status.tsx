import { Clock, FileWarning } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useTheme } from '@/hooks/use-theme';
import type { ProviderApplication } from '@/lib/types';

interface ApplicationStatusProps {
  application: ProviderApplication;
  /** Demande refusée : ouvre le formulaire prérempli. */
  onResubmit: () => void;
}

/** Statut d'une demande envoyée : en cours d'examen, ou refusée avec son motif. */
export function ApplicationStatus({ application, onResubmit }: ApplicationStatusProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatDateLong } = useFormats();
  const rejected = application.status === 'rejected';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        {rejected ? (
          <FileWarning size={22} color={colors.destructive} />
        ) : (
          <Clock size={22} color={colors.primary} />
        )}
        <AppText variant="subheading">
          {rejected ? t('apply.rejectedTitle') : t('apply.pendingTitle')}
        </AppText>
      </View>
      {rejected ? (
        <AppText variant="body">
          {t('apply.rejectedReason', { reason: application.rejectionReason ?? '' })}
        </AppText>
      ) : (
        <AppText variant="secondary">{t('apply.pendingMessage')}</AppText>
      )}
      <AppText variant="small" color={colors.textSecondary}>
        {t('apply.submittedOn', { date: formatDateLong(application.submittedAt) })}
      </AppText>
      {rejected ? <Button title={t('apply.resubmit')} onPress={onResubmit} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
