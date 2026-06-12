import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { ServiceIcon } from '@/components/service-icon';
import { Card } from '@/components/ui/card';
import { FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice } from '@/lib/format';
import type { ServiceDefinition } from '@/lib/services';

interface ServiceCardProps {
  service: ServiceDefinition;
  onPress: () => void;
}

export function ServiceCard({ service, onPress }: ServiceCardProps) {
  const colors = useTheme();

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <ServiceIcon serviceId={service.id} boxed size={24} />
        <View style={styles.texts}>
          <Text style={[styles.name, { color: colors.text }]}>{service.name}</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]} numberOfLines={1}>
            {service.tagline}
          </Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            Dès {formatPrice(service.hourlyRange.min)}/h
          </Text>
        </View>
        <ChevronRight size={20} color={colors.textSecondary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  texts: { flex: 1, gap: 2 },
  name: { fontSize: FontSize.base, fontWeight: '700' },
  tagline: { fontSize: FontSize.sm },
  price: { fontSize: FontSize.sm, fontWeight: '600', marginTop: 2 },
});
