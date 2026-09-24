import { Star } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

interface StarRatingInputProps {
  /** 0 = pas encore noté. */
  value: number;
  /** Absent : affichage seul (note déjà donnée). */
  onChange?: (value: number) => void;
  size?: number;
}

/** Cinq étoiles : choix d'une note (1 à 5) ou affichage d'une note donnée. */
export function StarRatingInput({ value, onChange, size = 32 }: StarRatingInputProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.row} accessibilityRole={onChange ? 'adjustable' : 'image'}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const icon = (
          <Star
            size={size}
            color={filled ? colors.accent : colors.border}
            fill={filled ? colors.accent : 'transparent'}
          />
        );
        return onChange ? (
          <Pressable
            key={star}
            onPress={() => {
              haptics.select();
              onChange(star);
            }}
            hitSlop={6}
            accessibilityLabel={t('review.starLabel', { count: star })}>
            {icon}
          </Pressable>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two },
});
