import { BadgeCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { ProviderAvatar } from '@/components/provider-avatar';
import { Rating } from '@/components/rating';
import { Font, FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Provider } from '@/lib/types';

interface ProviderRowProps {
  provider: Provider;
  /** Ligne secondaire : par défaut le temps de réponse */
  subtitle?: string;
}

export function ProviderRow({ provider, subtitle }: ProviderRowProps) {
  const colors = useTheme();

  return (
    <View style={styles.base}>
      <ProviderAvatar name={provider.name} photoPath={provider.photoPath} size={48} />
      <View style={styles.texts}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {provider.name}
          </Text>
          {provider.verified ? <BadgeCheck size={16} color={colors.primary} /> : null}
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {subtitle ?? provider.responseTime}
        </Text>
      </View>
      <Rating rating={provider.rating} reviewCount={provider.reviewCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  texts: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: FontSize.base, ...Font.semibold, flexShrink: 1 },
  subtitle: { ...Font.regular, fontSize: FontSize.sm },
});
