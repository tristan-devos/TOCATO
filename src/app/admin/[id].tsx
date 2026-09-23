import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ApplicationStatusBadge } from '@/components/admin/application-status-badge';
import { DecisionPanel } from '@/components/admin/decision-panel';
import { DocumentImage } from '@/components/admin/document-image';
import { RbqCheckCard } from '@/components/admin/rbq-check-card';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useTheme } from '@/hooks/use-theme';
import { useAdminApplication } from '@/lib/admin-store';

/** Admin : détail d'une demande d'adhésion, pièces et décision. */
export default function AdminApplicationScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatPrice, formatDateLong } = useFormats();
  const { id } = useLocalSearchParams<{ id: string }>();
  const application = useAdminApplication(id);

  if (!application) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
        <PageHeader title={t('admin.title')} />
      </SafeAreaView>
    );
  }

  const services = application.services.map((s) => t(`services.${s}.categoryName`)).join(', ');

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <PageHeader title={application.businessName} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <AppText variant="subheading" style={styles.flex}>
              {application.businessName}
            </AppText>
            <ApplicationStatusBadge status={application.status} />
          </View>
          <AppText variant="secondary">
            {t('admin.applicantLine', {
              name: application.applicantName,
              email: application.applicantEmail,
            })}
          </AppText>
          <AppText variant="secondary">
            {services} · {formatPrice(application.hourlyRate)}
          </AppText>
          <AppText variant="secondary">
            {t('admin.neqLine', { neq: application.neq })}
          </AppText>
          {application.bio ? <AppText variant="body">{application.bio}</AppText> : null}
          <AppText variant="small" color={colors.textSecondary}>
            {t('admin.sentOn', { date: formatDateLong(application.submittedAt) })}
          </AppText>
        </Card>

        <RbqCheckCard application={application} />

        <Card style={styles.card}>
          <AppText variant="label">{t('admin.documents')}</AppText>
          {application.idDocumentPath ? (
            <DocumentImage label={t('apply.idDocument')} path={application.idDocumentPath} />
          ) : (
            <AppText variant="secondary">
              {t('admin.idPurged', {
                date: application.idDocumentPurgedAt
                  ? formatDateLong(application.idDocumentPurgedAt)
                  : '',
              })}
            </AppText>
          )}
          <DocumentImage label={t('apply.insurance')} path={application.insurancePath} />
        </Card>

        {application.status === 'submitted' ? (
          <DecisionPanel application={application} />
        ) : (
          <AppText variant="secondary">
            {application.status === 'approved'
              ? t('admin.decidedApproved')
              : t('admin.decidedRejected', { reason: application.rejectionReason ?? '' })}
          </AppText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.five },
  card: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
