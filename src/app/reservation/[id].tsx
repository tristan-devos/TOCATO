import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, XCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { CelebrationModal } from '@/components/celebration/celebration';
import { ProviderRow } from '@/components/provider-row';
import { BookingSummary } from '@/components/reservation/booking-summary';
import { ProviderOffers } from '@/components/reservation/provider-offers';
import { RequestDetails } from '@/components/reservation/request-details';
import { StatusTimeline } from '@/components/reservation/status-timeline';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import { useStatusLine } from '@/hooks/use-status-line';
import { BOOKING_STATUS, isCancellableStatus } from '@/lib/booking-status';
import { formatAddress } from '@/lib/format';
import { useProvider } from '@/lib/providers-store';
import { useAppStore, useBooking } from '@/lib/store';

export default function ReservationDetailScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { formatPrice, formatPriceRange } = useFormats();
  const { id } = useLocalSearchParams<{ id: string }>();

  const booking = useBooking(id);
  const conversations = useAppStore((s) => s.conversations);
  const cancelBooking = useAppStore((s) => s.cancelBooking);
  // Prestataire confirmé (devis accepté) ; lu avant le retour anticipé (règle des hooks).
  const provider = useProvider(booking?.providerId);
  const statusText = useStatusLine();
  // Le prestataire termine pendant que le client regarde (Realtime) : on célèbre.
  // État ajusté pendant le rendu (motif React « state from props »), pas d'effet.
  const [seenStatus, setSeenStatus] = useState(booking?.status);
  const [celebrating, setCelebrating] = useState(false);
  if (booking && booking.status !== seenStatus) {
    setSeenStatus(booking.status);
    if (seenStatus === 'in_progress' && booking.status === 'completed') setCelebrating(true);
  }

  if (!booking) {
    return <Redirect href="/(tabs)/reservations" />;
  }

  // Conversation du prestataire confirmé ; tant que la demande est ouverte, les
  // offres reçues sont listées par ProviderOffers.
  const providerConversation = conversations.find(
    (c) => c.bookingId === booking.id && c.providerId === booking.providerId,
  );
  const status = BOOKING_STATUS[booking.status];
  const cancelled = booking.status === 'cancelled';

  const confirmCancel = () => {
    Alert.alert(t('reservationDetail.cancelTitle'), t('reservationDetail.cancelMessage'), [
      { text: t('reservationDetail.keepBooking'), style: 'cancel' },
      {
        text: t('reservationDetail.confirmCancel'),
        style: 'destructive',
        onPress: () => cancelBooking(booking.id),
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <AppText variant="subheading" style={styles.headerTitle}>
          {t('reservationDetail.title')}
        </AppText>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BookingSummary
          serviceId={booking.serviceId}
          createdAt={booking.createdAt}
          badge={{ label: t(`bookingStatus.${booking.status}`), tone: status.tone }}
          statusLine={statusText(booking)}
        />

        {cancelled ? (
          <Card style={[styles.cancelledCard, { backgroundColor: colors.destructiveMuted }]}>
            <XCircle size={20} color={colors.destructive} />
            <AppText variant="secondary" color={colors.destructive} style={styles.cancelledText}>
              {t('reservationDetail.cancelled')}
            </AppText>
          </Card>
        ) : (
          <StatusTimeline status={booking.status} />
        )}

        {provider ? (
          <View>
            <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
              {t('reservationDetail.providerSection')}
            </AppText>
            <Card
              style={styles.providerCard}
              onPress={() =>
                router.push({ pathname: '/provider/[id]', params: { id: provider.id } })
              }>
              <ProviderRow provider={provider} />
              <AppText variant="secondary">{provider.bio}</AppText>
            </Card>
          </View>
        ) : cancelled ? null : (
          <ProviderOffers bookingId={booking.id} serviceId={booking.serviceId} />
        )}

        <RequestDetails
          answers={booking.answers}
          description={booking.description}
          photos={booking.photos}
          location={formatAddress(booking.address)}
          scheduledDate={booking.scheduledDate}
          timeSlot={booking.timeSlot}
        />

        <View style={[styles.priceBanner, { backgroundColor: colors.primaryMuted }]}>
          <View style={styles.priceTexts}>
            <AppText variant="label" color={colors.primary}>
              {booking.agreedPrice != null
                ? t('reservationDetail.agreedPrice')
                : t('reservationDetail.estimate')}
            </AppText>
            {booking.agreedPrice == null ? (
              <AppText variant="small" color={colors.primary}>
                {t('reservationDetail.waitingQuote')}
              </AppText>
            ) : null}
          </View>
          <AppText variant="heading" color={colors.primary}>
            {booking.agreedPrice != null
              ? formatPrice(booking.agreedPrice)
              : formatPriceRange(booking.estimate)}
          </AppText>
        </View>

        <View style={styles.actions}>
          {providerConversation ? (
            <Button
              title={t('reservationDetail.openChat')}
              size="lg"
              onPress={() =>
                router.push({
                  pathname: '/chat/[id]',
                  params: { id: providerConversation.id },
                })
              }
            />
          ) : null}
          {isCancellableStatus(booking.status) ? (
            <Button
              title={t('reservationDetail.cancelBooking')}
              variant="destructive"
              onPress={confirmCancel}
            />
          ) : null}
        </View>
      </ScrollView>
      <CelebrationModal
        visible={celebrating}
        title={t('celebrate.jobCompletedTitle')}
        message={t('celebrate.jobCompletedClient', { name: provider?.name ?? '' })}
        closeLabel={t('celebrate.continue')}
        onClose={() => setCelebrating(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
  },
  headerButton: { width: 30, padding: Spacing.one },
  headerTitle: { flex: 1, textAlign: 'center' },
  content: { padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
  cancelledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 0,
  },
  cancelledText: { flex: 1 },
  sectionLabel: { marginBottom: Spacing.two, marginLeft: Spacing.one },
  providerCard: { gap: Spacing.three },
  priceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  priceTexts: { flex: 1, gap: 2 },
  actions: { gap: Spacing.two, marginTop: Spacing.one },
});
