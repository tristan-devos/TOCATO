import { Calendar, MapPin } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { ServiceIcon } from '@/components/service-icon';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BOOKING_STATUS } from '@/lib/booking-status';
import { formatDateLong, formatPrice, formatPriceRange } from '@/lib/format';
import { getProvider } from '@/lib/mock-data';
import { getService, TIME_SLOTS } from '@/lib/services';
import type { Booking } from '@/lib/types';

interface BookingCardProps {
  booking: Booking;
  onPress: () => void;
}

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const colors = useTheme();
  const service = getService(booking.serviceId);
  const provider = getProvider(booking.providerId);
  const status = BOOKING_STATUS[booking.status];
  const slot = TIME_SLOTS.find((s) => s.id === booking.timeSlot);

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ServiceIcon serviceId={service.id} boxed size={18} boxSize={40} />
          <View style={styles.titleTexts}>
            <Text style={[styles.title, { color: colors.text }]}>{service.categoryName}</Text>
            {provider ? (
              <Text style={[styles.provider, { color: colors.textSecondary }]}>
                {provider.name}
              </Text>
            ) : null}
          </View>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.detailRow}>
        <Calendar size={15} color={colors.textSecondary} />
        <Text style={[styles.detail, { color: colors.textSecondary }]}>
          {booking.scheduledDate
            ? `${formatDateLong(booking.scheduledDate)}${slot ? ` · ${slot.label.toLowerCase()}` : ''}`
            : 'Dès que possible'}
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
        {provider ? <Avatar name={provider.name} size={28} /> : null}
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
  title: { fontSize: FontSize.base, fontWeight: '600' },
  provider: { fontSize: FontSize.sm },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.three },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: 6 },
  detail: { fontSize: FontSize.sm, flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  price: { fontSize: FontSize.base, fontWeight: '700' },
});
