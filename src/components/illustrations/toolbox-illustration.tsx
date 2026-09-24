import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { heightFor, VIEWBOX, type IllustrationProps } from '@/components/illustrations/types';
import { useTheme } from '@/hooks/use-theme';

/** Boîte à outils : demandes et travaux du prestataire (états vides). */
export function ToolboxIllustration({ width = 160 }: IllustrationProps) {
  const c = useTheme();
  return (
    <Svg width={width} height={heightFor(width)} viewBox={VIEWBOX}>
      <Circle cx={80} cy={62} r={52} fill={c.primaryMuted} />
      <Path
        d="M64 44 v-8 a6 6 0 0 1 6 -6 h20 a6 6 0 0 1 6 6 v8"
        stroke={c.text}
        strokeWidth={4}
        fill="none"
      />
      <Rect x={36} y={44} width={88} height={50} rx={10} fill={c.primary} />
      <Rect x={36} y={60} width={88} height={6} fill={c.primaryPressed} />
      <Rect x={72} y={56} width={16} height={14} rx={3} fill={c.accent} />
      <Path
        d="M112 24 l14 14 M120 20 a7 7 0 1 0 10 10"
        stroke={c.textSecondary}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={30} cy={36} r={4} fill={c.accent} />
    </Svg>
  );
}
