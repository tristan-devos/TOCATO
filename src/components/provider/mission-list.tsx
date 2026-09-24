import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ServiceIcon } from '@/components/service-icon';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BOOKING_STATUS } from '@/lib/booking-status';
import type { Booking } from '@/lib/types';

interface MissionListProps {
  title: string;
  hint?: string;
  /** Texte si la liste est vide ; sans lui, une liste vide n'affiche que le titre. */
  emptyText?: string;
  missions: Booking[];
  /** Ligne sous le service : créneau (jour choisi) ou date (« À planifier »). */
  detailFor: (booking: Booking) => string;
  clientNameFor: (booking: Booking) => string;
  onOpen: (bookingId: string) => void;
}

/** Missions d'un jour du calendrier, ou celles à planifier ; toucher ouvre la mission. */
export function MissionList({
  title,
  hint,
  emptyText,
  missions,
  detailFor,
  clientNameFor,
  onOpen,
}: MissionListProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.base}>
      <AppText variant="label" color={colors.textSecondary}>
        {title}
      </AppText>
      {hint ? <AppText variant="small">{hint}</AppText> : null}
      {missions.length === 0 && emptyText ? (
        <AppText variant="secondary">{emptyText}</AppText>
      ) : null}
      {missions.map((mission) => {
        const client = clientNameFor(mission);
        return (
          <Card key={mission.id} onPress={() => onOpen(mission.id)} style={styles.row}>
            <ServiceIcon serviceId={mission.serviceId} boxed size={18} boxSize={40} />
            <View style={styles.texts}>
              <AppText variant="label" numberOfLines={1}>
                {t(`services.${mission.serviceId}.categoryName`)}
                {client ? ` · ${client}` : ''}
              </AppText>
              <AppText variant="small" numberOfLines={1}>
                {detailFor(mission)}
              </AppText>
            </View>
            {mission.status !== 'confirmed' ? (
              <Badge
                label={t(`bookingStatus.${mission.status}`)}
                tone={BOOKING_STATUS[mission.status].tone}
              />
            ) : null}
            <ChevronRight size={18} color={colors.textSecondary} />
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  texts: { flex: 1, gap: Spacing.half },
});
