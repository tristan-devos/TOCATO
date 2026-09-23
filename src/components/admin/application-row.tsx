import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApplicationStatusBadge } from '@/components/admin/application-status-badge';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useTheme } from '@/hooks/use-theme';
import type { AdminApplication } from '@/lib/types';

interface ApplicationRowProps {
  application: AdminApplication;
  onPress: () => void;
}

/** Ligne de la liste des adhésions : entreprise, demandeur, services, statut. */
export function ApplicationRow({ application, onPress }: ApplicationRowProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatDateShort } = useFormats();
  const services = application.services.map((id) => t(`services.${id}.categoryName`)).join(', ');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card style={styles.card}>
        <View style={styles.top}>
          <AppText variant="label" style={styles.name} numberOfLines={1}>
            {application.businessName}
          </AppText>
          <ApplicationStatusBadge status={application.status} />
        </View>
        <AppText variant="secondary">{application.applicantName}</AppText>
        <AppText variant="small" color={colors.textSecondary}>
          {services} · {t('admin.sentOn', { date: formatDateShort(application.submittedAt) })}
        </AppText>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.one },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  name: { flex: 1 },
});
