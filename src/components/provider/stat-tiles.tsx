import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface StatTile {
  value: string;
  label: string;
  onPress: () => void;
}

/** Rangée de chiffres clés du tableau de bord ; toucher une tuile ouvre l'écran concerné. */
export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  const colors = useTheme();
  return (
    <View style={styles.row}>
      {tiles.map((tile) => (
        <Card key={tile.label} onPress={tile.onPress} style={styles.tile}>
          <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit>
            {tile.value}
          </AppText>
          <AppText variant="small" color={colors.textSecondary} numberOfLines={2}>
            {tile.label}
          </AppText>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two },
  tile: { flex: 1, gap: Spacing.one, paddingVertical: Spacing.three, paddingHorizontal: Spacing.two + 4 },
});
