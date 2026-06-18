import { Calendar, FileText, Images, MapPin } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProviderRow } from '@/components/provider-row';
import { ServiceIcon } from '@/components/service-icon';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import { getProvider } from '@/lib/mock-data';
import { estimatePrice, TIME_SLOTS, type ServiceDefinition } from '@/lib/services';
import type { Address, BookingAnswer, TimeSlotId } from '@/lib/types';

interface ReviewStepProps {
  service: ServiceDefinition;
  answers: BookingAnswer[];
  description: string;
  photoCount: number;
  address: Address;
  asap: boolean;
  scheduledDate: string | null;
  timeSlot: TimeSlotId | null;
  /** Prestataire choisi ; null = attribution automatique. */
  providerId: string | null;
}

function ReviewRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowContent}>{children}</View>
    </View>
  );
}

export function ReviewStep({
  service,
  answers,
  description,
  photoCount,
  address,
  asap,
  scheduledDate,
  timeSlot,
  providerId,
}: ReviewStepProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatDateLong, formatPriceRange } = useFormats();
  const estimate = estimatePrice(service.id);
  const slot = TIME_SLOTS.find((s) => s.id === timeSlot);
  const provider = providerId ? getProvider(providerId) : undefined;

  const scheduleLabel = asap
    ? t('common.asap')
    : scheduledDate
      ? `${formatDateLong(scheduledDate)}${slot ? ` · ${t(`timeSlots.${slot.id}`).toLowerCase()} (${t(`timeSlots.${slot.id}Hours`)})` : ''}`
      : '—';

  return (
    <View style={styles.base}>
      <View style={styles.titles}>
        <AppText variant="heading">{t('wizard.reviewTitle')}</AppText>
        <AppText variant="secondary">{t('wizard.reviewSubtitle')}</AppText>
      </View>

      <Card style={styles.card}>
        <View style={styles.serviceRow}>
          <ServiceIcon serviceId={service.id} size={18} />
          <AppText variant="subheading">{service.categoryName}</AppText>
        </View>

        {answers.map((answer) => (
          <View key={answer.questionId} style={styles.answerRow}>
            <AppText variant="secondary">{answer.questionLabel}</AppText>
            <AppText variant="label" style={styles.answerValue}>
              {answer.values.join(', ')}
            </AppText>
          </View>
        ))}
      </Card>

      <Card style={styles.card}>
        <ReviewRow icon={<FileText size={16} color={colors.textSecondary} />}>
          <AppText variant="secondary" numberOfLines={3}>
            {description}
          </AppText>
        </ReviewRow>
        {photoCount > 0 ? (
          <ReviewRow icon={<Images size={16} color={colors.textSecondary} />}>
            <AppText variant="secondary">
              {t('reservationDetail.photos', { count: photoCount })}
            </AppText>
          </ReviewRow>
        ) : null}
        <ReviewRow icon={<MapPin size={16} color={colors.textSecondary} />}>
          <AppText variant="secondary">
            {address.label} — {address.street}, {address.city} {address.postalCode}
          </AppText>
        </ReviewRow>
        <ReviewRow icon={<Calendar size={16} color={colors.textSecondary} />}>
          <AppText variant="secondary">{scheduleLabel}</AppText>
        </ReviewRow>
      </Card>

      <Card style={styles.providerCard}>
        <AppText variant="secondary">{t('common.provider')}</AppText>
        {provider ? (
          <ProviderRow provider={provider} />
        ) : (
          <AppText variant="label">{t('wizard.reviewProviderAuto')}</AppText>
        )}
      </Card>

      <View style={[styles.estimate, { backgroundColor: colors.primaryMuted }]}>
        <View style={styles.estimateTexts}>
          <AppText variant="label" color={colors.primary}>
            {t('wizard.estimate')}
          </AppText>
          <AppText variant="small" color={colors.primary}>
            {t('wizard.estimateNote')}
          </AppText>
        </View>
        <AppText variant="subheading" color={colors.primary}>
          {formatPriceRange(estimate)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.three },
  titles: { gap: Spacing.two, marginBottom: Spacing.one },
  card: { gap: Spacing.two + 4 },
  providerCard: { gap: Spacing.two + 2 },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  answerRow: { gap: 1 },
  answerValue: {},
  row: { flexDirection: 'row', gap: Spacing.two + 2 },
  rowIcon: { marginTop: 2 },
  rowContent: { flex: 1 },
  estimate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  estimateTexts: { flex: 1, gap: 2 },
});
