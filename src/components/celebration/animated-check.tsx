import { useEffect } from 'react';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
// Longueur du tracé de la coche (viewBox 0 0 96 96), pour le dessiner au trait.
const CHECK_LENGTH = 52;

/**
 * Coche de réussite : le disque apparaît en ressort, puis la coche se dessine.
 * Figée, déjà dessinée, si l'utilisateur a demandé de réduire les animations.
 */
export function AnimatedCheck({ size = 96 }: { size?: number }) {
  const colors = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0.4);
  const hidden = useSharedValue(reduceMotion ? 0 : 1);

  useEffect(() => {
    if (reduceMotion) return;
    scale.set(withSpring(1, { damping: 12, stiffness: 180 }));
    hidden.set(withDelay(180, withTiming(0, { duration: 320 })));
  }, [reduceMotion, scale, hidden]);

  const discStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: hidden.get() * CHECK_LENGTH }));

  return (
    <Animated.View style={discStyle}>
      <Svg width={size} height={size} viewBox="0 0 96 96">
        <Circle cx={48} cy={48} r={46} fill={colors.successMuted} />
        <Circle cx={48} cy={48} r={34} fill={colors.success} />
        <AnimatedPath
          d="M32 49 L43 60 L65 37"
          stroke={colors.onPrimary}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={CHECK_LENGTH}
          animatedProps={checkProps}
        />
      </Svg>
    </Animated.View>
  );
}
