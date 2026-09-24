import { Calendar, MapPin } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProviderAvatar } from '@/components/provider-avatar';
import { ServiceIcon } from '@/components/service-icon';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Font, FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import { BOOKING_STATUS } from '@/lib/booking-status';
import { useProvider } from '@/lib/providers-store';
import { TIME_SLOTS } from '@/lib/services';
import { useAppStore } from '@/lib/store';
import type { Booking } from '@/lib/types';

interface BookingCardProps {
  booking: Booking;
  onPress: () => void;
  /** Remplace la ligne sous le titre (ex. prénom du client côté prestataire). */
  subtitle?: string;
}

export function BookingCard({ booking, onPress, subtitle: subtitleOverride }: BookingCardProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatDateLong, formatPrice, formatPriceRange } = useFormats();
  const conversations = useAppStore((s) => s.conversations);
  const provider = useProvider(booking.providerId);
  const status = BOOKING_STATUS[booking.status];
  const slot = TIME_SLOTS.find((s) => s.id === booking.timeSlot);

  // Demande encore ouverte : on affiche l'avancement côté prestataires.
  const offerCount = useMemo(
    () => conversations.filter((c) => c.bookingId === booking.id).length,
    [conversations, booking.id],
  );
  const subtitle = subtitleOverride
    ? subtitleOverride
    : provider
    ? provider.name
    : booking.status === 'pending'
      ? offerCount > 0
        ? t('providerOffers.interested', { count: offerCount })
        : t('providerOffers.waitingShort')
      : null;

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ServiceIcon serviceId={booking.serviceId} boxed size={18} boxSize={40} />
          <View style={styles.titleTexts}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t(`services.${booking.serviceId}.categoryName`)}
            </Text>
            {subtitle ? (
              <Text style={[styles.provider, { color: colors.textSecondary }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <Badge label={t(`bookingStatus.${booking.status}`)} tone={status.tone} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.detailRow}>
        <Calendar size={15} color={colors.textSecondary} />
        <Text style={[styles.detail, { color: colors.textSecondary }]}>
          {booking.scheduledDate
            ? `${formatDateLong(booking.scheduledDate)}${slot ? ` · ${t(`timeSlots.${slot.id}`).toLowerCase()}` : ''}`
            : t('common.asap')}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <MapPin size={15} color={colors.textSecondary} />
        <Text style={[styles.detail, { color: colors.textSecondary }]} numberOfLines={1}>
          {booking.address.street}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.price, { color: colors.text }]}>
          {booking.agreedPrice != null
            ? formatPrice(booking.agreedPrice)
            : `Est. ${formatPriceRange(booking.estimate)}`}
        </Text>
        {provider ? (
          <ProviderAvatar name={provider.name} photoPath={provider.photoPath} size={28} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2, flex: 1 },
  titleTexts: { flex: 1 },
  title: { fontSize: FontSize.base, ...Font.semibold },
  provider: { ...Font.regular, fontSize: FontSize.sm },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.three },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: 6 },
  detail: { ...Font.regular, fontSize: FontSize.sm, flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  price: { fontSize: FontSize.base, ...Font.bold },
});
