import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ServiceIcon } from '@/components/service-icon';
import { Card } from '@/components/ui/card';
import { FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import { useLocalizedService } from '@/lib/use-localized-service';
import type { ServiceId } from '@/lib/types';

interface ServiceCardProps {
  serviceId: ServiceId;
  onPress: () => void;
}

export function ServiceCard({ serviceId, onPress }: ServiceCardProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatPrice } = useFormats();
  const service = useLocalizedService(serviceId);

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <ServiceIcon serviceId={serviceId} boxed size={24} />
        <View style={styles.texts}>
          <Text style={[styles.name, { color: colors.text }]}>{service.name}</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]} numberOfLines={1}>
            {service.tagline}
          </Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            {t('serviceCard.from', { price: formatPrice(service.hourlyRange.min) })}
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
