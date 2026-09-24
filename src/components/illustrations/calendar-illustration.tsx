import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { heightFor, VIEWBOX, type IllustrationProps } from '@/components/illustrations/types';
import { useTheme } from '@/hooks/use-theme';

/** Calendrier coché et feuille : réservations et missions (états vides). */
export function CalendarIllustration({ width = 160 }: IllustrationProps) {
  const c = useTheme();
  return (
    <Svg width={width} height={heightFor(width)} viewBox={VIEWBOX}>
      <Circle cx={80} cy={62} r={52} fill={c.primaryMuted} />
      <Rect
        x={44}
        y={30}
        width={72}
        height={64}
        rx={10}
        fill={c.card}
        stroke={c.border}
        strokeWidth={2}
      />
      <Rect x={44} y={30} width={72} height={16} rx={8} fill={c.primary} />
      <Rect x={56} y={24} width={6} height={14} rx={3} fill={c.text} />
      <Rect x={98} y={24} width={6} height={14} rx={3} fill={c.text} />
      <Rect x={54} y={54} width={12} height={10} rx={3} fill={c.backgroundElement} />
      <Rect x={74} y={54} width={12} height={10} rx={3} fill={c.backgroundElement} />
      <Rect x={94} y={54} width={12} height={10} rx={3} fill={c.accentMuted} />
      <Rect x={54} y={72} width={12} height={10} rx={3} fill={c.backgroundElement} />
      <Rect x={74} y={72} width={12} height={10} rx={3} fill={c.backgroundElement} />
      <Circle cx={116} cy={88} r={14} fill={c.primary} />
      <Path
        d="M109 88 l5 5 l9 -10"
        stroke={c.onPrimary}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M30 96 C 30 80, 44 74, 50 72 C 50 84, 42 94, 30 96 Z"
        fill={c.primary}
        opacity={0.7}
      />
      <Circle cx={130} cy={30} r={4} fill={c.accent} />
    </Svg>
  );
}
