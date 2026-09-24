import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CalendarDayProps {
  day: Date;
  missionCount: number;
  selected: boolean;
  today: boolean;
  /** Jour d'un mois voisin (grille du mois) : estompé. */
  muted?: boolean;
  onPress: () => void;
}

/** Case d'un jour : numéro, point si missions, sélection pleine, aujourd'hui cerclé. */
export function CalendarDay({ day, missionCount, selected, today, muted, onPress }: CalendarDayProps) {
  const colors = useTheme();
  const textColor = selected ? colors.onPrimary : muted ? colors.textSecondary : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={styles.cell}>
      <View
        style={[
          styles.circle,
          selected && { backgroundColor: colors.primary },
          !selected && today && { borderColor: colors.primary, borderWidth: 1.5 },
        ]}>
        <AppText variant="label" color={textColor} style={muted && styles.muted}>
          {day.getDate()}
        </AppText>
      </View>
      <View style={styles.dots}>
        {Array.from({ length: Math.min(missionCount, 3) }, (_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: colors.accent }]} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', gap: Spacing.half, paddingVertical: Spacing.one },
  circle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: { opacity: 0.5 },
  dots: { flexDirection: 'row', gap: 2, height: 5 },
  dot: { width: 5, height: 5, borderRadius: Radius.full },
});
