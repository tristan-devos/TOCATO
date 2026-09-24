import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { BookingSummary } from '@/components/reservation/booking-summary';
import { RequestDetails } from '@/components/reservation/request-details';
import { StatusTimeline } from '@/components/reservation/status-timeline';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Radius, Spacing } from '@/constants/theme';
import { useCounterpartName } from '@/hooks/use-counterpart';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import { BOOKING_STATUS } from '@/lib/booking-status';
import { formatAddress } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useProviderStore } from '@/lib/provider-store';
import { useAppStore, useBooking } from '@/lib/store';

/**
 * Mission d'un prestataire (réservation où il a été retenu) : adresse exacte,
 * prix convenu, et avancement (commencer puis terminer l'intervention).
 */
export default function JobDetailScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { formatPrice } = useFormats();
  const { id } = useLocalSearchParams<{ id: string }>();
  const booking = useBooking(id);
  const conversations = useAppStore((s) => s.conversations);
  const counterpartName = useCounterpartName();
  const startJob = useProviderStore((s) => s.startJob);
  const completeJob = useProviderStore((s) => s.completeJob);
  const [busy, setBusy] = useState(false);

  if (!booking) {
    return <Redirect href="/(provider)/jobs" />;
  }

  const conversation = conversations.find((c) => c.bookingId === booking.id);
  const status = BOOKING_STATUS[booking.status];

  const confirmThen = (title: string, message: string, action: () => Promise<boolean>) => {
    Alert.alert(title, message, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('providerApp.confirm'),
        onPress: () => {
          setBusy(true);
          void action()
            .then((ok) => {
              if (ok) haptics.success();
            })
            .finally(() => setBusy(false));
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <PageHeader title={t('providerApp.jobTitle')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BookingSummary
          serviceId={booking.serviceId}
          createdAt={booking.createdAt}
          badge={{ label: t(`bookingStatus.${booking.status}`), tone: status.tone }}
        />
        {booking.status !== 'cancelled' ? <StatusTimeline status={booking.status} /> : null}

        {conversation ? (
          <AppText variant="label">
            {t('providerApp.clientLabel', { name: counterpartName(conversation) })}
          </AppText>
        ) : null}

        <RequestDetails
          answers={booking.answers}
          description={booking.description}
          photos={booking.photos}
          location={formatAddress(booking.address)}
          scheduledDate={booking.scheduledDate}
          timeSlot={booking.timeSlot}
        />

        {booking.agreedPrice != null ? (
          <View style={[styles.priceBanner, { backgroundColor: colors.primaryMuted }]}>
            <AppText variant="label" color={colors.primary}>
              {t('reservationDetail.agreedPrice')}
            </AppText>
            <AppText variant="heading" color={colors.primary}>
              {formatPrice(booking.agreedPrice)}
            </AppText>
          </View>
        ) : null}

        <View style={styles.actions}>
          {booking.status === 'confirmed' ? (
            <Button
              title={t('providerApp.startJob')}
              size="lg"
              loading={busy}
              onPress={() =>
                confirmThen(t('providerApp.startJobTitle'), t('providerApp.startJobMessage'), () =>
                  startJob(booking.id),
                )
              }
            />
          ) : null}
          {booking.status === 'in_progress' ? (
            <Button
              title={t('providerApp.completeJob')}
              size="lg"
              loading={busy}
              onPress={() =>
                confirmThen(
                  t('providerApp.completeJobTitle'),
                  t('providerApp.completeJobMessage'),
                  () => completeJob(booking.id),
                )
              }
            />
          ) : null}
          {conversation ? (
            <Button
              title={t('reservationDetail.openChat')}
              variant="outline"
              onPress={() =>
                router.push({ pathname: '/chat/[id]', params: { id: conversation.id } })
              }
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
  priceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  actions: { gap: Spacing.two, marginTop: Spacing.one },
});
