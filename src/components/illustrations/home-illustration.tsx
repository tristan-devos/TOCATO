import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { heightFor, VIEWBOX, type IllustrationProps } from '@/components/illustrations/types';
import { useTheme } from '@/hooks/use-theme';

/** Maison au soleil : accroche de l'accueil client. */
export function HomeIllustration({ width = 160 }: IllustrationProps) {
  const c = useTheme();
  return (
    <Svg width={width} height={heightFor(width)} viewBox={VIEWBOX}>
      <Circle cx={118} cy={30} r={14} fill={c.accent} />
      <Path d="M20 100 H140" stroke={c.border} strokeWidth={3} strokeLinecap="round" />
      <Path d="M40 60 L80 28 L120 60" fill={c.primary} />
      <Rect x={48} y={58} width={64} height={42} fill={c.card} stroke={c.border} strokeWidth={2} />
      <Rect x={72} y={74} width={16} height={26} rx={3} fill={c.primary} />
      <Rect x={56} y={68} width={11} height={11} rx={2} fill={c.accentMuted} />
      <Rect x={93} y={68} width={11} height={11} rx={2} fill={c.accentMuted} />
      <Path
        d="M24 100 C 24 86, 34 80, 38 78 C 38 90, 32 98, 24 100 Z"
        fill={c.primary}
        opacity={0.7}
      />
      <Path
        d="M136 100 C 136 88, 128 82, 124 80 C 124 90, 130 98, 136 100 Z"
        fill={c.primary}
        opacity={0.5}
      />
    </Svg>
  );
}
