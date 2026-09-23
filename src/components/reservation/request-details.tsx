import { Calendar, FileText, Images, MapPin } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BookingPhotos } from '@/components/booking/booking-photos';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import type { BookingAnswer, TimeSlotId } from '@/lib/types';

interface RequestDetailsProps {
  answers: BookingAnswer[];
  description: string;
  /** Chemins Storage des photos (URLs signées à l'affichage). */
  photos: string[];
  /**
   * Lieu déjà formaté : adresse complète (client, mission confirmée) ou seulement
   * « ville · secteur » (demande ouverte vue par un prestataire).
   */
  location: string;
  scheduledDate?: string;
  timeSlot?: TimeSlotId;
}

/**
 * Section « Votre demande » : réponses du wizard, description, photos, lieu et
 * date. Partagée par le détail client, la demande ouverte et la mission côté
 * prestataire.
 */
export function RequestDetails({
  answers,
  description,
  photos,
  location,
  scheduledDate,
  timeSlot,
}: RequestDetailsProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatDateLong } = useFormats();

  const scheduleText = scheduledDate
    ? `${formatDateLong(scheduledDate)}${timeSlot ? ` · ${t(`timeSlots.${timeSlot}`).toLowerCase()} (${t(`timeSlots.${timeSlot}Hours`)})` : ''}`
    : t('common.asap');

  return (
    <View>
      <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
        {t('reservationDetail.requestSection')}
      </AppText>
      <Card style={styles.detailsCard}>
        {answers.map((answer) => (
          <View key={answer.questionId} style={styles.answerRow}>
            <AppText variant="secondary">{answer.questionLabel}</AppText>
            <AppText variant="label">{answer.values.join(', ')}</AppText>
          </View>
        ))}

        {answers.length > 0 ? (
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        ) : null}

        <View style={styles.iconRow}>
          <FileText size={16} color={colors.textSecondary} />
          <AppText variant="secondary" style={styles.iconRowText}>
            {description}
          </AppText>
        </View>
        {photos.length > 0 ? (
          <View style={styles.iconRow}>
            <Images size={16} color={colors.textSecondary} />
            <View style={styles.iconRowText}>
              <AppText variant="secondary" style={styles.photosLabel}>
                {t('reservationDetail.photos', { count: photos.length })}
              </AppText>
              <BookingPhotos photos={photos} />
            </View>
          </View>
        ) : null}
        <View style={styles.iconRow}>
          <MapPin size={16} color={colors.textSecondary} />
          <AppText variant="secondary" style={styles.iconRowText}>
            {location}
          </AppText>
        </View>
        <View style={styles.iconRow}>
          <Calendar size={16} color={colors.textSecondary} />
          <AppText variant="secondary" style={styles.iconRowText}>
            {scheduleText}
          </AppText>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { marginBottom: Spacing.two, marginLeft: Spacing.one },
  detailsCard: { gap: Spacing.two + 4 },
  answerRow: { gap: 1 },
  dividerLine: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.one },
  iconRow: { flexDirection: 'row', gap: Spacing.two + 2 },
  iconRowText: { flex: 1, marginTop: -1 },
  photosLabel: { marginBottom: Spacing.two },
});
