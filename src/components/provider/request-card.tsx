import { Calendar, MapPin } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ServiceIcon } from '@/components/service-icon';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import { formatSector } from '@/lib/format';
import type { OpenRequest } from '@/lib/types';

interface RequestCardProps {
  request: OpenRequest;
  onPress: () => void;
}

/** Carte d'une demande ouverte (liste « Demandes » du prestataire). */
export function RequestCard({ request, onPress }: RequestCardProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatDateLong, formatPriceRange, formatRelative } = useFormats();

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <ServiceIcon serviceId={request.serviceId} boxed size={20} boxSize={42} />
        <View style={styles.titles}>
          <AppText variant="subheading">
            {t(`services.${request.serviceId}.categoryName`)}
          </AppText>
          <AppText variant="small" color={colors.textSecondary}>
            {formatRelative(request.createdAt)}
          </AppText>
        </View>
        {request.myQuoteStatus === 'pending' ? (
          <Badge label={t('providerApp.quoteSentBadge')} tone="primary" />
        ) : null}
        {request.myQuoteStatus === 'declined' ? (
          <Badge label={t('providerApp.quoteDeclinedBadge')} tone="neutral" />
        ) : null}
      </View>

      <AppText variant="secondary" numberOfLines={2}>
        {request.description}
      </AppText>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <MapPin size={14} color={colors.textSecondary} />
          <AppText variant="small" color={colors.textSecondary}>
            {formatSector(request.city, request.postalSector)}
          </AppText>
        </View>
        <View style={styles.metaItem}>
          <Calendar size={14} color={colors.textSecondary} />
          <AppText variant="small" color={colors.textSecondary}>
            {request.scheduledDate ? formatDateLong(request.scheduledDate) : t('common.asap')}
          </AppText>
        </View>
      </View>

      <AppText variant="label" color={colors.primary}>
        {formatPriceRange(request.estimate)}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two + 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 4 },
  titles: { flex: 1, gap: 1 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
