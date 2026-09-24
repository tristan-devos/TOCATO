import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '@/hooks/use-press-scale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  /** Style selon l'état pressé (couleur de fond, opacité…). */
  style?: StyleProp<ViewStyle> | ((pressed: boolean) => StyleProp<ViewStyle>);
  /** Échelle au toucher (0.97 par défaut ; plus faible pour les grandes surfaces). */
  scaleTo?: number;
}

/** Pressable qui se contracte au toucher : base de Button, Card et Chip. */
export function PressableScale({ children, style, scaleTo, ...rest }: PressableScaleProps) {
  const { animatedStyle, pressed, onPressIn, onPressOut } = usePressScale(scaleTo);
  const resolved = typeof style === 'function' ? style(pressed) : style;
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[resolved, animatedStyle]}>
      {children}
    </AnimatedPressable>
  );
}
