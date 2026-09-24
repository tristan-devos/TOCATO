import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

/**
 * Bloc de chargement pulsé : une attente se montre, jamais un écran vide.
 * Seule animation en boucle de l'app, et figée si l'utilisateur a demandé de
 * réduire les animations.
 */
export function Skeleton({ width = '100%', height = 14, radius = Radius.sm }: SkeletonProps) {
  const colors = useTheme();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!reduceMotion) opacity.set(withRepeat(withTiming(0.45, { duration: 700 }), -1, true));
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.backgroundElement },
        animatedStyle,
      ]}
    />
  );
}

interface ListSkeletonProps {
  /** Forme des éléments attendus : carte (réservations, missions) ou ligne (conversations). */
  variant: 'card' | 'row';
  count?: number;
}

/** Liste de squelettes, affichée tant que les données ne sont pas chargées. */
export function ListSkeleton({ variant, count = 3 }: ListSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);
  if (variant === 'row') {
    return (
      <View style={[styles.list, styles.rows]}>
        {items.map((i) => (
          <View key={i} style={styles.row}>
            <Skeleton width={48} height={48} radius={Radius.full} />
            <View style={styles.texts}>
              <Skeleton width="55%" height={16} />
              <Skeleton width="85%" />
            </View>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.list}>
      {items.map((i) => (
        <Card key={i}>
          <View style={styles.row}>
            <Skeleton width={40} height={40} radius={Radius.md} />
            <View style={styles.texts}>
              <Skeleton width="50%" height={16} />
              <Skeleton width="35%" />
            </View>
          </View>
          <View style={styles.details}>
            <Skeleton width="70%" />
            <Skeleton width="60%" />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  // Les lignes de conversation portent leur propre marge : on la reproduit.
  rows: { padding: Spacing.three, gap: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  texts: { flex: 1, gap: Spacing.two },
  details: { gap: Spacing.two, marginTop: Spacing.three },
});
