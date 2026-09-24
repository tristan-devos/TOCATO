import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/card';
import { Font, FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { BookingStatus } from '@/lib/types';

const STATUS_ORDER: Record<Exclude<BookingStatus, 'cancelled'>, number> = {
  pending: 0,
  confirmed: 1,
  in_progress: 2,
  completed: 3,
};

interface StatusTimelineProps {
  status: BookingStatus;
}

/** Frise verticale de progression d'une réservation (hors statut annulé). */
export function StatusTimeline({ status }: StatusTimelineProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const reachedIndex = status === 'cancelled' ? 0 : STATUS_ORDER[status];

  const timeline: { status: BookingStatus; label: string }[] = [
    { status: 'pending', label: t('reservationDetail.timelinePending') },
    { status: 'confirmed', label: t('reservationDetail.timelineConfirmed') },
    { status: 'in_progress', label: t('reservationDetail.timelineInProgress') },
    { status: 'completed', label: t('reservationDetail.timelineCompleted') },
  ];

  return (
    <Card>
      <View style={styles.timeline}>
        {timeline.map((step, index) => {
          const done = index <= reachedIndex;
          const isLast = index === timeline.length - 1;
          return (
            <View key={step.status} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: done ? colors.primary : colors.backgroundElement,
                      borderColor: done ? colors.primary : colors.border,
                    },
                  ]}>
                  {done ? <Check size={11} color={colors.onPrimary} /> : null}
                </View>
                {!isLast ? (
                  <View
                    style={[
                      styles.timelineLine,
                      { backgroundColor: index < reachedIndex ? colors.primary : colors.border },
                    ]}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  styles.timelineLabel,
                  { color: done ? colors.text : colors.textSecondary },
                  index === reachedIndex && styles.timelineLabelCurrent,
                ]}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: Spacing.three },
  timelineRail: { alignItems: 'center', width: 20 },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: { width: 2, flex: 1, minHeight: 18, marginVertical: 2 },
  timelineLabel: { ...Font.regular, fontSize: FontSize.sm, flex: 1, paddingBottom: Spacing.three, marginTop: 2 },
  timelineLabelCurrent: { ...Font.bold },
});
