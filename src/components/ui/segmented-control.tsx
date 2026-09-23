import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SegmentedControlProps<T extends string> {
  options: { id: T; label: string }[];
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
            onPress={() => onChange(option.id)}
            style={[styles.segment, selected && { backgroundColor: colors.card }]}>
            <Text
              style={[styles.label, { color: selected ? colors.text : colors.textSecondary }]}>
              {option.label}
            </Text>
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
  label: { fontSize: FontSize.sm, fontWeight: '600' },
});
