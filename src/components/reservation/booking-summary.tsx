import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ServiceIcon } from '@/components/service-icon';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import type { ServiceId } from '@/lib/types';

type BadgeTone = 'primary' | 'success' | 'warning' | 'destructive' | 'neutral';

interface BookingSummaryProps {
  serviceId: ServiceId;
  /** Date de la demande (ISO). */
  createdAt: string;
  badge?: { label: string; tone: BadgeTone };
}

/** Carte d'en-tête d'une demande : service, date de la demande, statut. */
export function BookingSummary({ serviceId, createdAt, badge }: BookingSummaryProps) {
  const { t } = useTranslation();
  const { formatDateLong } = useFormats();

  return (
    <Card>
      <View style={styles.row}>
        <ServiceIcon serviceId={serviceId} boxed size={22} boxSize={48} />
        <View style={styles.texts}>
          <AppText variant="subheading">{t(`services.${serviceId}.categoryName`)}</AppText>
          <AppText variant="secondary">
            {t('reservationDetail.requestDate', { date: formatDateLong(createdAt) })}
          </AppText>
        </View>
        {badge ? <Badge label={badge.label} tone={badge.tone} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  texts: { flex: 1, gap: 2 },
});
