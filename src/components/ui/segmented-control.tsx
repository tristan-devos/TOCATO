import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, FontSize, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

interface SegmentedControlProps<T extends string> {
  /** `badge` : compteur affiché à côté du libellé (ex. non-lus), masqué à 0. */
  options: { id: T; label: string; badge?: number }[];
  value: T;
  onChange: (id: T) => void;
}

/** Sélecteur à segments (ex. « En cours / Historique »). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const colors = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.backgroundElement }]}>
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <Pressable
            key={option.id}
            onPress={() => {
              if (!selected) haptics.select();
              onChange(option.id);
            }}
            style={[styles.segment, selected && { backgroundColor: colors.card }]}>
            <View style={styles.content}>
              <Text
                style={[styles.label, { color: selected ? colors.text : colors.textSecondary }]}>
                {option.label}
              </Text>
              {option.badge ? (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.badgeText, { color: colors.onPrimary }]}>
                    {option.badge}
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', borderRadius: Radius.md, padding: 3 },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.md - 3,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: FontSize.sm, ...Font.semibold },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, ...Font.bold },
});
