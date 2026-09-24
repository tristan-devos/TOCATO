import { Zap } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { DaySlotPicker } from '@/components/ui/day-slot-picker';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, toDateKey } from '@/lib/calendar';
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

/** Demain et les 13 jours suivants (le wizard ne propose pas aujourd'hui). */
function nextDays(): string[] {
  const today = new Date();
  return Array.from({ length: DAYS_SHOWN }, (_, i) => toDateKey(addDays(today, i + 1)));
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
  const { t } = useTranslation();
  const days = useMemo(() => nextDays(), []);

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

      <DaySlotPicker
        days={days}
        date={asap ? null : scheduledDate}
        onDateChange={onDateChange}
        slot={timeSlot}
        onSlotChange={onTimeSlotChange}
        slotLabel={t('wizard.schedulePreferredSlot')}
      />

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
  asapNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  asapText: { flex: 1 },
});
