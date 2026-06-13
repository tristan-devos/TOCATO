import { Zap } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

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

function buildDays(locale: string): DayOption[] {
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'short' });
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

export function ScheduleStep({
  asap,
  onAsapChange,
  scheduledDate,
  onDateChange,
  timeSlot,
  onTimeSlotChange,
}: ScheduleStepProps) {
  const colors = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-CA' : 'fr-CA';
  const days = useMemo(() => buildDays(locale), [locale]);

  return (
    <View style={styles.base}>
      <View style={styles.titles}>
        <AppText variant="heading">{t('wizard.scheduleTitle')}</AppText>
      </View>

      <Chip
        label={t('wizard.scheduleAsap')}
        hint={t('wizard.scheduleAsapHint')}
        selected={asap}
        onPress={() => onAsapChange(true)}
      />

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <AppText variant="small" color={colors.textSecondary}>
          {t('wizard.scheduleOrPickDate')}
        </AppText>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysRow}>
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
              <Text
                style={[
                  styles.dayWeekday,
                  { color: selected ? colors.onPrimary : colors.textSecondary },
                ]}>
                {dayOption.weekday}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  { color: selected ? colors.onPrimary : colors.text },
                ]}>
                {dayOption.day}
              </Text>
              <Text
                style={[
                  styles.dayMonth,
                  { color: selected ? colors.onPrimary : colors.textSecondary },
                ]}>
                {dayOption.month}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!asap && scheduledDate ? (
        <View style={styles.slots}>
          <AppText variant="label">{t('wizard.schedulePreferredSlot')}</AppText>
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
                  <Text
                    style={[styles.slotLabel, { color: selected ? colors.primary : colors.text }]}>
                    {t(`timeSlots.${slot.id}`)}
                  </Text>
                  <Text style={[styles.slotHours, { color: colors.textSecondary }]}>
                    {t(`timeSlots.${slot.id}Hours`)}
                  </Text>
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
            {t('wizard.scheduleUrgentNote')}
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
