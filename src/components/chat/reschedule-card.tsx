import { CalendarClock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useMissionWhen } from '@/hooks/use-mission-when';
import { useTheme } from '@/hooks/use-theme';
import type { Message, Reschedule } from '@/lib/types';

interface RescheduleCardProps {
  message: Message;
  reschedule: Reschedule;
  /** Sa propre proposition (prestataire) : à droite, sans boutons. */
  mine: boolean;
  /** Client uniquement : accepter/refuser. Absent = pas de boutons. */
  onRespond?: (messageId: string, accept: boolean) => void;
}

/**
 * Nouvelle date proposée par le prestataire retenu. La mission ne change de date que
 * si le client accepte ; sinon la date prévue est maintenue.
 */
export function RescheduleCard({ message, reschedule, mine, onRespond }: RescheduleCardProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatTime } = useFormats();
  const missionWhen = useMissionWhen();
  const pending = reschedule.status === 'pending';

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.warning }]}>
      <View style={styles.header}>
        <CalendarClock size={18} color={colors.warning} />
        <AppText variant="label" style={styles.title}>
          {t('reschedule.cardTitle')}
        </AppText>
        {reschedule.status === 'accepted' ? (
          <Badge label={t('messageBubble.accepted')} tone="success" />
        ) : null}
        {reschedule.status === 'declined' ? (
          <Badge label={t('messageBubble.declined')} tone="neutral" />
        ) : null}
      </View>
      <AppText variant="subheading">
        {missionWhen({ scheduledDate: reschedule.date, timeSlot: reschedule.slot })}
      </AppText>
      <AppText variant="small">
        {t('reschedule.insteadOf', {
          when: missionWhen({
            scheduledDate: reschedule.previousDate,
            timeSlot: reschedule.previousSlot,
          }),
        })}
      </AppText>
      {reschedule.reason ? (
        <AppText variant="secondary">« {reschedule.reason} »</AppText>
      ) : null}
      {!mine && pending && onRespond ? (
        <View style={styles.actions}>
          <Button
            title={t('reschedule.keepDate')}
            variant="outline"
            size="sm"
            onPress={() => onRespond(message.id, false)}
            style={styles.action}
          />
          <Button
            title={t('reschedule.accept')}
            size="sm"
            onPress={() => onRespond(message.id, true)}
            style={styles.action}
          />
        </View>
      ) : null}
      {mine && pending ? (
        <Badge label={t('messageBubble.awaitingAnswer')} tone="warning" />
      ) : null}
      <AppText variant="small" style={styles.time}>
        {formatTime(message.createdAt)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '85%',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1 },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  action: { flex: 1 },
  time: { alignSelf: 'flex-end' },
});
