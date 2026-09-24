import { CalendarCheck, MapPin } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ServiceIcon } from '@/components/service-icon';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Radius, Spacing } from '@/constants/theme';
import { useMissionWhen } from '@/hooks/use-mission-when';
import { useTheme } from '@/hooks/use-theme';
import { formatSector } from '@/lib/format';
import type { Booking } from '@/lib/types';

interface NextMissionCardProps {
  mission: Booking | undefined;
  clientName: string;
  onOpen: (bookingId: string) => void;
  onSeeRequests: () => void;
}

/**
 * Mission mise en avant en haut de l'Accueil : celle en cours, sinon la prochaine.
 * Sans mission à venir : invitation à répondre aux demandes ouvertes.
 */
export function NextMissionCard({ mission, clientName, onOpen, onSeeRequests }: NextMissionCardProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const missionWhen = useMissionWhen();

  if (!mission) {
    return (
      <Card>
        <EmptyState
          icon={<CalendarCheck size={28} color={colors.primary} />}
          title={t('providerHome.noUpcomingTitle')}
          message={t('providerHome.noUpcomingMessage')}
          actionLabel={t('providerHome.seeRequests')}
          onAction={onSeeRequests}
        />
      </Card>
    );
  }

  const sector = formatSector(mission.address.city, mission.address.postalCode.slice(0, 3));

  return (
    <View style={[styles.card, { backgroundColor: colors.primary }]}>
      <View style={styles.top}>
        <AppText variant="small" color={colors.onPrimary} style={styles.eyebrow}>
          {t('providerHome.nextMission').toUpperCase()}
        </AppText>
        {mission.status === 'in_progress' ? (
          <Badge label={t('providerHome.inProgress')} tone="warning" />
        ) : null}
      </View>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.card }]}>
          <ServiceIcon serviceId={mission.serviceId} size={22} />
        </View>
        <View style={styles.texts}>
          <AppText variant="heading" color={colors.onPrimary}>
            {t(`services.${mission.serviceId}.categoryName`)}
          </AppText>
          <AppText variant="body" color={colors.onPrimary}>
            {missionWhen(mission)}
          </AppText>
        </View>
      </View>
      <View style={styles.place}>
        <MapPin size={15} color={colors.onPrimary} />
        <AppText variant="secondary" color={colors.onPrimary} numberOfLines={1}>
          {[clientName, sector].filter((part) => part.length > 0).join(' · ')}
        </AppText>
      </View>
      <Button
        title={t('providerHome.viewMission')}
        variant="secondary"
        onPress={() => onOpen(mission.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.xl, padding: Spacing.four, gap: Spacing.three },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { letterSpacing: 1, opacity: 0.85 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  icon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: Spacing.half },
  place: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one + 2 },
});
