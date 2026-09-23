import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StepHeader } from '@/components/apply/step-header';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useTheme } from '@/hooks/use-theme';
import {
  digitsOnly,
  formatRbqLicence,
  needsRbqLicence,
  parseHourlyRate,
  type ApplicationDraft,
} from '@/lib/application-draft';

/** Étape 4 : récapitulatif avant envoi. */
export function ApplicationReview({ draft }: { draft: ApplicationDraft }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatPrice } = useFormats();
  const rate = parseHourlyRate(draft.hourlyRate);

  const rows: { label: string; value: string }[] = [
    { label: t('apply.businessName'), value: draft.businessName.trim() },
    {
      label: t('apply.services'),
      value: draft.services.map((id) => t(`services.${id}.categoryName`)).join(', '),
    },
    { label: t('apply.hourlyRate'), value: rate === null ? '' : formatPrice(rate) },
    { label: t('apply.neq'), value: digitsOnly(draft.neq) },
    ...(needsRbqLicence(draft.services)
      ? [{ label: t('apply.rbqLicence'), value: formatRbqLicence(draft.rbqLicence) }]
      : []),
    { label: t('apply.documentsTitle'), value: t('apply.documentsProvided') },
  ];

  return (
    <View style={styles.base}>
      <StepHeader title={t('apply.reviewTitle')} subtitle={t('apply.reviewSubtitle')} />
      <Card style={styles.card}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <AppText variant="small" color={colors.textSecondary}>
              {row.label}
            </AppText>
            <AppText variant="body">{row.value}</AppText>
          </View>
        ))}
        {draft.bio.trim() ? (
          <View style={styles.row}>
            <AppText variant="small" color={colors.textSecondary}>
              {t('apply.bio')}
            </AppText>
            <AppText variant="secondary">{draft.bio.trim()}</AppText>
          </View>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.three },
  card: { gap: Spacing.three },
  row: { gap: Spacing.half },
});
