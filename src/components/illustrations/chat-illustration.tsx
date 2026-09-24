import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { heightFor, VIEWBOX, type IllustrationProps } from '@/components/illustrations/types';
import { useTheme } from '@/hooks/use-theme';

/** Deux bulles de conversation : messages (état vide). */
export function ChatIllustration({ width = 160 }: IllustrationProps) {
  const c = useTheme();
  return (
    <Svg width={width} height={heightFor(width)} viewBox={VIEWBOX}>
      <Circle cx={80} cy={62} r={52} fill={c.primaryMuted} />
      <Rect
        x={30}
        y={30}
        width={70}
        height={40}
        rx={14}
        fill={c.card}
        stroke={c.border}
        strokeWidth={2}
      />
      <Path d="M44 70 l-6 12 l16 -12 Z" fill={c.card} />
      <Rect x={42} y={42} width={40} height={5} rx={2.5} fill={c.backgroundElement} />
      <Rect x={42} y={53} width={28} height={5} rx={2.5} fill={c.backgroundElement} />
      <Rect x={64} y={60} width={66} height={36} rx={14} fill={c.primary} />
      <Path d="M116 96 l8 10 l-2 -10 Z" fill={c.primary} />
      <Circle cx={84} cy={78} r={4} fill={c.onPrimary} />
      <Circle cx={97} cy={78} r={4} fill={c.onPrimary} />
      <Circle cx={110} cy={78} r={4} fill={c.onPrimary} />
      <Circle cx={128} cy={34} r={5} fill={c.accent} />
    </Svg>
  );
}
