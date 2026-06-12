import { Zap } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { TIME_SLOTS } from '@/lib/services';
import type { TimeSlotId } from '@/lib/types';

const DAYS_SHOWN = 14;

interface ScheduleStepProps {
  asap: boolean;
  onAsapChange: (asap: boolean) => void;
  scheduledDate: string | null;
  onDateChange: (isoDate: string) => void;
  timeSlot: TimeSlotId | null;
  onTimeSlotChange: (slot: TimeSlotId) => void;
}

interface DayOption {
  iso: string;
  weekday: string;
  day: number;
  month: string;
}

function buildDays(): DayOption[] {
  const weekdayFmt = new Intl.DateTimeFormat('fr-CA', { weekday: 'short' });
  const monthFmt = new Intl.DateTimeFormat('fr-CA', { month: 'short' });
  return Array.from({ length: DAYS_SHOWN }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + 1 + i);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return {
      iso,
      weekday: weekdayFmt.format(date).replace('.', ''),
      day: date.getDate(),
      month: monthFmt.format(date).replace('.', ''),
    };
  });
}

/** Étape « date » : dès que possible, ou date + créneau. */
export function ScheduleStep({
  asap,
  onAsapChange,
  scheduledDate,
  onDateChange,
  timeSlot,
  onTimeSlotChange,
}: ScheduleStepProps) {
  const colors = useTheme();
  const days = useMemo(buildDays, []);

  return (
    <View style={styles.base}>
      <View style={styles.titles}>
        <AppText variant="heading">Quand souhaitez-vous la prestation ?</AppText>
      </View>

      <Chip
        label="Dès que possible"
        hint="Le prestataire propose le premier créneau disponible"
        selected={asap}
        onPress={() => onAsapChange(true)}
      />

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <AppText variant="small" color={colors.textSecondary}>
          ou choisissez une date
        </AppText>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
        {days.map((dayOption) => {
          const selected = !asap && scheduledDate === dayOption.iso;
          return (
            <Pressable
              key={dayOption.iso}
              onPress={() => onDateChange(dayOption.iso)}
              style={[
                styles.day,
                {
                  backgroundColor: selected ? colors.primary : colors.card,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}>
              <Text style={[styles.dayWeekday, { color: selected ? colors.onPrimary : colors.textSecondary }]}>
                {dayOption.weekday}
              </Text>
              <Text style={[styles.dayNumber, { color: selected ? colors.onPrimary : colors.text }]}>
                {dayOption.day}
              </Text>
              <Text style={[styles.dayMonth, { color: selected ? colors.onPrimary : colors.textSecondary }]}>
                {dayOption.month}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!asap && scheduledDate ? (
        <View style={styles.slots}>
          <AppText variant="label">Créneau souhaité</AppText>
          <View style={styles.slotsRow}>
            {TIME_SLOTS.map((slot) => {
              const selected = timeSlot === slot.id;
              return (
                <Pressable
                  key={slot.id}
                  onPress={() => onTimeSlotChange(slot.id)}
                  style={[
                    styles.slot,
                    {
                      backgroundColor: selected ? colors.primaryMuted : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text style={[styles.slotLabel, { color: selected ? colors.primary : colors.text }]}>
                    {slot.label}
                  </Text>
                  <Text style={[styles.slotHours, { color: colors.textSecondary }]}>{slot.hours}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {asap ? (
        <View style={[styles.asapNote, { backgroundColor: colors.warningMuted }]}>
          <Zap size={16} color={colors.warning} />
          <AppText variant="secondary" style={styles.asapText} color={colors.warning}>
            Les demandes urgentes peuvent entraîner une majoration.
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.four },
  titles: { gap: Spacing.two },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  daysRow: { gap: Spacing.two },
  day: {
    width: 60,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 2,
  },
  dayWeekday: { fontSize: FontSize.xs, textTransform: 'capitalize' },
  dayNumber: { fontSize: FontSize.lg, fontWeight: '700' },
  dayMonth: { fontSize: FontSize.xs, textTransform: 'capitalize' },
  slots: { gap: Spacing.two + 4 },
  slotsRow: { flexDirection: 'row', gap: Spacing.two },
  slot: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    gap: 2,
  },
  slotLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  slotHours: { fontSize: FontSize.xs },
  asapNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  asapText: { flex: 1 },
});
