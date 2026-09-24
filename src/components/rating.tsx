import { Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Font, FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface RatingProps {
  rating: number;
  reviewCount?: number;
}

export function Rating({ rating, reviewCount }: RatingProps) {
  const colors = useTheme();

  return (
    <View style={styles.base}>
      <Star size={14} color={colors.accent} fill={colors.accent} />
      <Text style={[styles.value, { color: colors.text }]}>{rating.toFixed(1)}</Text>
      {reviewCount != null ? (
        <Text style={[styles.count, { color: colors.textSecondary }]}>({reviewCount})</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  value: { fontSize: FontSize.sm, ...Font.semibold },
  count: { ...Font.regular, fontSize: FontSize.sm },
});
