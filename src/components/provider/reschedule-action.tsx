import { CalendarClock, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { DaySlotPicker } from '@/components/ui/day-slot-picker';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useMissionWhen } from '@/hooks/use-mission-when';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { useProviderStore } from '@/lib/provider-store';
import { proposableDays } from '@/lib/quote-draft';
import { useAppStore } from '@/lib/store';
import type { Booking, TimeSlotId } from '@/lib/types';

interface RescheduleActionProps {
  booking: Booking;
  conversationId: string | undefined;
}

/**
 * « Proposer une autre date » sur une mission confirmée : fenêtre de choix (jour,
 * créneau, motif), puis carte dans le chat que le client accepte ou refuse. Une
 * proposition à la fois ; la date prévue reste valable d'ici là.
 */
export function RescheduleAction({ booking, conversationId }: RescheduleActionProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const missionWhen = useMissionWhen();
  const messages = useAppStore((s) => s.messages);
  const proposeReschedule = useProviderStore((s) => s.proposeReschedule);
  const [open, setOpen] = useState(false);
  const [today] = useState(() => new Date());
  const days = useMemo(() => proposableDays(today), [today]);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<TimeSlotId | null>(null);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pending = useMemo(
    () =>
      messages.find(
        (m) =>
          m.conversationId === conversationId &&
          m.type === 'reschedule' &&
          m.reschedule?.status === 'pending',
      )?.reschedule,
    [messages, conversationId],
  );

  const submit = async () => {
    if (!date || !slot) {
      setError('missing');
      return;
    }
    setSending(true);
    setError(null);
    const failure = await proposeReschedule(booking.id, date, slot, reason);
    setSending(false);
    if (failure) {
      setError(failure);
      return;
    }
    haptics.success();
    setOpen(false);
  };

  if (pending) {
    return (
      <View style={[styles.pending, { backgroundColor: colors.warningMuted }]}>
        <CalendarClock size={18} color={colors.warning} />
        <AppText variant="secondary" color={colors.warning} style={styles.flex}>
          {t('reschedule.pendingNotice', {
            when: missionWhen({ scheduledDate: pending.date, timeSlot: pending.slot }),
          })}
        </AppText>
      </View>
    );
  }

  return (
    <>
      <Button
        title={t('reschedule.propose')}
        variant="outline"
        icon={<CalendarClock size={18} color={colors.text} />}
        onPress={() => setOpen(true)}
      />
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <AppText variant="heading" style={styles.flex}>
              {t('reschedule.propose')}
            </AppText>
            <Pressable
              onPress={() => setOpen(false)}
              hitSlop={10}
              accessibilityLabel={t('common.cancel')}>
              <X size={22} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <AppText variant="secondary">
              {t('reschedule.currentDate', { when: missionWhen(booking) })}
            </AppText>
            <DaySlotPicker
              days={days}
              date={date}
              onDateChange={setDate}
              slot={slot}
              onSlotChange={setSlot}
              slotLabel={t('quoteForm.slotLabel')}
            />
            <TextField
              label={t('reschedule.reasonLabel')}
              value={reason}
              onChangeText={setReason}
              placeholder={t('reschedule.reasonPlaceholder')}
              maxLength={300}
            />
            <AppText variant="small">{t('reschedule.explain')}</AppText>
            {error ? (
              <AppText variant="secondary" color={colors.destructive}>
                {t(`reschedule.errors.${error}`, { defaultValue: t('reschedule.errors.generic') })}
              </AppText>
            ) : null}
            <Button
              title={t('reschedule.send')}
              size="lg"
              loading={sending}
              onPress={() => void submit()}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  content: { padding: Spacing.three, gap: Spacing.four, paddingBottom: Spacing.five },
});
