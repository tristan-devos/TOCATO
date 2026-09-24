import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Font, FontSize, Radius, Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useTheme } from '@/hooks/use-theme';
import { fromDateKey } from '@/lib/calendar';
import { TIME_SLOTS } from '@/lib/services';
import type { TimeSlotId } from '@/lib/types';

interface DaySlotPickerProps {
  /** Jours proposés (YYYY-MM-DD), dans l'ordre. */
  days: string[];
  date: string | null;
  onDateChange: (date: string) => void;
  slot: TimeSlotId | null;
  onSlotChange: (slot: TimeSlotId) => void;
  /** Titre au-dessus des créneaux, affichés une fois un jour choisi. */
  slotLabel: string;
}

/**
 * Choix d'un jour (bande horizontale) puis d'un créneau (matin, après-midi, soir) :
 * wizard de réservation et date proposée dans un devis.
 */
export function DaySlotPicker({
  days,
  date,
  onDateChange,
  slot,
  onSlotChange,
  slotLabel,
}: DaySlotPickerProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { locale } = useFormats();
  const options = useMemo(() => {
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const month = new Intl.DateTimeFormat(locale, { month: 'short' });
    return days.map((key) => {
      const day = fromDateKey(key);
      return {
        key,
        weekday: weekday.format(day).replace('.', ''),
        day: day.getDate(),
        month: month.format(day).replace('.', ''),
      };
    });
  }, [days, locale]);

  return (
    <View style={styles.base}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysRow}>
        {options.map((option) => {
          const selected = date === option.key;
          const fg = selected ? colors.onPrimary : colors.textSecondary;
          return (
            <Pressable
              key={option.key}
              onPress={() => onDateChange(option.key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[
                styles.day,
                {
                  backgroundColor: selected ? colors.primary : colors.card,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}>
              <Text style={[styles.dayWeekday, { color: fg }]}>{option.weekday}</Text>
              <Text
                style={[styles.dayNumber, { color: selected ? colors.onPrimary : colors.text }]}>
                {option.day}
              </Text>
              <Text style={[styles.dayMonth, { color: fg }]}>{option.month}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {date ? (
        <View style={styles.slots}>
          <AppText variant="label">{slotLabel}</AppText>
          <View style={styles.slotsRow}>
            {TIME_SLOTS.map((option) => {
              const selected = slot === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => onSlotChange(option.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.slot,
                    {
                      backgroundColor: selected ? colors.primaryMuted : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text
                    style={[styles.slotLabel, { color: selected ? colors.primary : colors.text }]}>
                    {t(`timeSlots.${option.id}`)}
                  </Text>
                  <Text style={[styles.slotHours, { color: colors.textSecondary }]}>
                    {t(`timeSlots.${option.id}Hours`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.four },
  daysRow: { gap: Spacing.two },
  day: {
    width: 60,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 2,
  },
  dayWeekday: { ...Font.regular, fontSize: FontSize.xs, textTransform: 'capitalize' },
  dayNumber: { ...Font.bold, fontSize: FontSize.lg },
  dayMonth: { ...Font.regular, fontSize: FontSize.xs, textTransform: 'capitalize' },
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
  slotLabel: { ...Font.semibold, fontSize: FontSize.sm },
  slotHours: { ...Font.regular, fontSize: FontSize.xs },
});
