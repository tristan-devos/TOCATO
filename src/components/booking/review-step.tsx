import { Calendar, FileText, Images, MapPin } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ServiceIcon } from '@/components/service-icon';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateLong, formatPriceRange } from '@/lib/format';
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
}

function ReviewRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowContent}>{children}</View>
    </View>
  );
}

/** Dernière étape : récapitulatif complet avant envoi de la demande. */
export function ReviewStep({
  service,
  answers,
  description,
  photoCount,
  address,
  asap,
  scheduledDate,
  timeSlot,
}: ReviewStepProps) {
  const colors = useTheme();
  const estimate = estimatePrice(service.id);
  const slot = TIME_SLOTS.find((s) => s.id === timeSlot);

  const scheduleLabel = asap
    ? 'Dès que possible'
    : scheduledDate
      ? `${formatDateLong(scheduledDate)}${slot ? ` · ${slot.label.toLowerCase()} (${slot.hours})` : ''}`
      : '—';

  return (
    <View style={styles.base}>
      <View style={styles.titles}>
        <AppText variant="heading">Récapitulatif</AppText>
        <AppText variant="secondary">
          Vérifiez votre demande — elle sera envoyée au prestataire le plus adapté.
        </AppText>
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
              {photoCount} photo{photoCount > 1 ? 's' : ''} jointe{photoCount > 1 ? 's' : ''}
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

      <View style={[styles.estimate, { backgroundColor: colors.primaryMuted }]}>
        <View style={styles.estimateTexts}>
          <AppText variant="label" color={colors.primary}>
            Estimation
          </AppText>
          <AppText variant="small" color={colors.primary}>
            Le prix final sera confirmé par devis dans le chat.
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
