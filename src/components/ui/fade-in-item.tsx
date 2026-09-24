import type { ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Au-delà, l'élément est hors de l'écran à l'ouverture : pas d'entrée animée
// (ni au défilement, ni un décalage qui s'allonge sans fin).
const ANIMATED_ITEMS = 8;
const STAGGER_MS = 40;

interface FadeInItemProps {
  /** Position dans la liste : décale l'entrée des premiers éléments. */
  index: number;
  children: ReactNode;
}

/**
 * Entrée d'un élément de liste : fondu et légère montée, décalée de 40 ms par
 * élément. Les animations d'entrée de reanimated suivent le réglage système
 * « réduire les animations ».
 */
export function FadeInItem({ index, children }: FadeInItemProps) {
  const entering =
    index < ANIMATED_ITEMS ? FadeInDown.duration(260).delay(index * STAGGER_MS) : undefined;
  return <Animated.View entering={entering}>{children}</Animated.View>;
}
