import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ProgressBarProps {
  /** Progression entre 0 et 1 */
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const colors = useTheme();
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.track, { backgroundColor: colors.backgroundElement }]}>
      <View
        style={[styles.fill, { backgroundColor: colors.primary, width: `${clamped * 100}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: Radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.full },
});
