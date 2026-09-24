import { useState } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

// Ressort court et amorti : le toucher se voit sans rebond perceptible.
const SPRING = { damping: 20, stiffness: 400, mass: 0.6 } as const;

/**
 * Réponse visuelle au toucher (docs/experience-emotionnelle.md §3) : l'élément
 * se contracte légèrement tant qu'il est pressé. `pressed` sert aux couleurs
 * d'état (le style d'un Pressable animé ne peut pas être une fonction).
 * Coupé si l'utilisateur a demandé de réduire les animations.
 */
export function usePressScale(scaleTo = 0.97) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const onPressIn = () => {
    setPressed(true);
    if (!reduceMotion) scale.set(withSpring(scaleTo, SPRING));
  };
  const onPressOut = () => {
    setPressed(false);
    if (!reduceMotion) scale.set(withSpring(1, SPRING));
  };

  return { animatedStyle, pressed, onPressIn, onPressOut };
}
