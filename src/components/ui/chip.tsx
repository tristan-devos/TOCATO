import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Font, FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

interface ChipProps {
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
}

/** Option sélectionnable du flux de réservation (carte pleine largeur). */
export function Chip({ label, hint, selected, onPress }: ChipProps) {
  const colors = useTheme();

  return (
    <PressableScale
      onPress={() => {
        if (!selected) haptics.select();
        onPress();
      }}
      style={(pressed) => [
        styles.base,
        {
          backgroundColor: selected ? colors.primaryMuted : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={styles.texts}>
        <Text style={[styles.label, { color: selected ? colors.primary : colors.text }]}>{label}</Text>
        {hint ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>
        ) : null}
      </View>
      <View
        style={[
          styles.radio,
          { borderColor: selected ? colors.primary : colors.border },
          selected && { backgroundColor: colors.primary },
        ]}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  texts: { flex: 1, gap: 2 },
  label: { fontSize: FontSize.base, ...Font.semibold },
  hint: { ...Font.regular, fontSize: FontSize.sm },
  radio: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 2,
  },
});
