import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CalendarDay } from '@/components/provider/calendar-day';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useTheme } from '@/hooks/use-theme';
import {
  addDays,
  addMonths,
  fromDateKey,
  monthGrid,
  toDateKey,
  weekDays,
  weekStartFor,
} from '@/lib/calendar';

type Mode = 'week' | 'month';

interface MissionCalendarProps {
  /** Jour choisi (`YYYY-MM-DD`) : ses missions s'affichent sous le calendrier. */
  selectedKey: string;
  todayKey: string;
  /** Nombre de missions par jour (`YYYY-MM-DD`). */
  countFor: (dateKey: string) => number;
  onSelect: (dateKey: string) => void;
}

/**
 * Calendrier des missions, fait maison : semaine par défaut, bascule sur le mois.
 * Les flèches changent de semaine ou de mois ; un point par mission (3 au plus).
 */
export function MissionCalendar({ selectedKey, todayKey, countFor, onSelect }: MissionCalendarProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { locale, formatMonthYear, formatWeekdayNarrow } = useFormats();
  const weekStart = weekStartFor(locale);
  const [mode, setMode] = useState<Mode>('week');
  // Jour de référence de la période affichée (la sélection peut en sortir).
  const [anchor, setAnchor] = useState(() => fromDateKey(selectedKey));

  const days = weekDays(anchor, weekStart);
  const move = (direction: 1 | -1) =>
    setAnchor(mode === 'week' ? addDays(anchor, 7 * direction) : addMonths(anchor, direction));

  const renderDay = (day: Date, muted = false) => {
    const key = toDateKey(day);
    return (
      <CalendarDay
        key={key}
        day={day}
        missionCount={countFor(key)}
        selected={key === selectedKey}
        today={key === todayKey}
        muted={muted}
        onPress={() => {
          onSelect(key);
          setAnchor(day);
        }}
      />
    );
  };

  const modes: { id: Mode; label: string }[] = [
    { id: 'week', label: t('providerHome.calendarWeek') },
    { id: 'month', label: t('providerHome.calendarMonth') },
  ];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Pressable
          onPress={() => move(-1)}
          hitSlop={10}
          accessibilityLabel={t('providerHome.previous')}>
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
        <Pressable
          style={styles.title}
          onPress={() => {
            onSelect(todayKey);
            setAnchor(fromDateKey(todayKey));
          }}
          accessibilityHint={t('providerHome.today')}>
          <AppText variant="subheading">{formatMonthYear(anchor)}</AppText>
        </Pressable>
        <Pressable onPress={() => move(1)} hitSlop={10} accessibilityLabel={t('providerHome.next')}>
          <ChevronRight size={22} color={colors.text} />
        </Pressable>
      </View>
      <SegmentedControl options={modes} value={mode} onChange={setMode} />
      <View style={styles.row}>
        {days.map((day) => (
          <AppText key={day.getDay()} variant="small" style={styles.weekday}>
            {formatWeekdayNarrow(day)}
          </AppText>
        ))}
      </View>
      {mode === 'week' ? (
        <View style={styles.row}>{days.map((day) => renderDay(day))}</View>
      ) : (
        monthGrid(anchor, weekStart).map((week) => (
          <View key={toDateKey(week[0]?.day ?? anchor)} style={styles.row}>
            {week.map(({ day, inMonth }) => renderDay(day, !inMonth))}
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, alignItems: 'center' },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center' },
});
