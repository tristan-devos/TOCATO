import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Check,
  FileText,
  Images,
  MapPin,
  XCircle,
} from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ProviderRow } from '@/components/provider-row';
import { ServiceIcon } from '@/components/service-icon';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import { BOOKING_STATUS, isActiveStatus } from '@/lib/booking-status';
import { getProvider } from '@/lib/mock-data';
import { TIME_SLOTS } from '@/lib/services';
import { useAppStore, useBooking } from '@/lib/store';
import type { BookingStatus } from '@/lib/types';

const STATUS_ORDER: Record<Exclude<BookingStatus, 'cancelled'>, number> = {
  pending: 0,
  confirmed: 1,
  in_progress: 2,
  completed: 3,
};

export default function ReservationDetailScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { formatDateLong, formatPrice, formatPriceRange } = useFormats();
  const { id } = useLocalSearchParams<{ id: string }>();

  const booking = useBooking(id);
  const cancelBooking = useAppStore((s) => s.cancelBooking);

  if (!booking) {
    return <Redirect href="/(tabs)/reservations" />;
  }

  const provider = getProvider(booking.providerId);
  const status = BOOKING_STATUS[booking.status];
  const slot = TIME_SLOTS.find((s) => s.id === booking.timeSlot);
  const cancelled = booking.status === 'cancelled';
  const reachedIndex = booking.status === 'cancelled' ? 0 : STATUS_ORDER[booking.status];

  const TIMELINE: { status: BookingStatus; label: string }[] = [
    { status: 'pending', label: t('reservationDetail.timelinePending') },
    { status: 'confirmed', label: t('reservationDetail.timelineConfirmed') },
    { status: 'in_progress', label: t('reservationDetail.timelineInProgress') },
    { status: 'completed', label: t('reservationDetail.timelineCompleted') },
  ];

  const openChat = () =>
    router.push({ pathname: '/chat/[id]', params: { id: booking.conversationId } });

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

  const scheduleText = booking.scheduledDate
    ? `${formatDateLong(booking.scheduledDate)}${slot ? ` · ${t(`timeSlots.${slot.id}`).toLowerCase()} (${t(`timeSlots.${slot.id}Hours`)})` : ''}`
    : t('common.asap');

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
        <Card style={styles.summary}>
          <View style={styles.summaryRow}>
            <ServiceIcon serviceId={booking.serviceId} boxed size={22} boxSize={48} />
            <View style={styles.summaryTexts}>
              <AppText variant="subheading">
                {t(`services.${booking.serviceId}.categoryName`)}
              </AppText>
              <AppText variant="secondary">
                {t('reservationDetail.requestDate', { date: formatDateLong(booking.createdAt) })}
              </AppText>
            </View>
            <Badge label={t(`bookingStatus.${booking.status}`)} tone={status.tone} />
          </View>
        </Card>

        {cancelled ? (
          <Card style={[styles.cancelledCard, { backgroundColor: colors.destructiveMuted }]}>
            <XCircle size={20} color={colors.destructive} />
            <AppText variant="secondary" color={colors.destructive} style={styles.cancelledText}>
              {t('reservationDetail.cancelled')}
            </AppText>
          </Card>
        ) : (
          <Card>
            <View style={styles.timeline}>
              {TIMELINE.map((step, index) => {
                const done = index <= reachedIndex;
                const isLast = index === TIMELINE.length - 1;
                return (
                  <View key={step.status} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View
                        style={[
                          styles.timelineDot,
                          {
                            backgroundColor: done ? colors.primary : colors.backgroundElement,
                            borderColor: done ? colors.primary : colors.border,
                          },
                        ]}>
                        {done ? <Check size={11} color={colors.onPrimary} /> : null}
                      </View>
                      {!isLast ? (
                        <View
                          style={[
                            styles.timelineLine,
                            {
                              backgroundColor:
                                index < reachedIndex ? colors.primary : colors.border,
                            },
                          ]}
                        />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.timelineLabel,
                        { color: done ? colors.text : colors.textSecondary },
                        index === reachedIndex && styles.timelineLabelCurrent,
                      ]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {provider ? (
          <View>
            <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
              {t('reservationDetail.providerSection')}
            </AppText>
            <Card style={styles.providerCard}>
              <ProviderRow provider={provider} />
              <AppText variant="secondary">{provider.bio}</AppText>
            </Card>
          </View>
        ) : null}

        <View>
          <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
            {t('reservationDetail.requestSection')}
          </AppText>
          <Card style={styles.detailsCard}>
            {booking.answers.map((answer) => (
              <View key={answer.questionId} style={styles.answerRow}>
                <AppText variant="secondary">{answer.questionLabel}</AppText>
                <AppText variant="label">{answer.values.join(', ')}</AppText>
              </View>
            ))}

            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

            <View style={styles.iconRow}>
              <FileText size={16} color={colors.textSecondary} />
              <AppText variant="secondary" style={styles.iconRowText}>
                {booking.description}
              </AppText>
            </View>
            {booking.photoCount > 0 ? (
              <View style={styles.iconRow}>
                <Images size={16} color={colors.textSecondary} />
                <AppText variant="secondary" style={styles.iconRowText}>
                  {t('reservationDetail.photos', { count: booking.photoCount })}
                </AppText>
              </View>
            ) : null}
            <View style={styles.iconRow}>
              <MapPin size={16} color={colors.textSecondary} />
              <AppText variant="secondary" style={styles.iconRowText}>
                {booking.address.label} — {booking.address.street}, {booking.address.city}{' '}
                {booking.address.postalCode}
              </AppText>
            </View>
            <View style={styles.iconRow}>
              <Calendar size={16} color={colors.textSecondary} />
              <AppText variant="secondary" style={styles.iconRowText}>
                {scheduleText}
              </AppText>
            </View>
          </Card>
        </View>

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
          <Button title={t('reservationDetail.openChat')} size="lg" onPress={openChat} />
          {isActiveStatus(booking.status) ? (
            <Button
              title={t('reservationDetail.cancelBooking')}
              variant="destructive"
              onPress={confirmCancel}
            />
          ) : null}
        </View>
      </ScrollView>
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
  summary: {},
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  summaryTexts: { flex: 1, gap: 2 },
  cancelledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 0,
  },
  cancelledText: { flex: 1 },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: Spacing.three },
  timelineRail: { alignItems: 'center', width: 20 },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: { width: 2, flex: 1, minHeight: 18, marginVertical: 2 },
  timelineLabel: { fontSize: FontSize.sm, flex: 1, paddingBottom: Spacing.three, marginTop: 2 },
  timelineLabelCurrent: { fontWeight: '700' },
  sectionLabel: { marginBottom: Spacing.two, marginLeft: Spacing.one },
  providerCard: { gap: Spacing.three },
  detailsCard: { gap: Spacing.two + 4 },
  answerRow: { gap: 1 },
  dividerLine: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.one },
  iconRow: { flexDirection: 'row', gap: Spacing.two + 2 },
  iconRowText: { flex: 1, marginTop: -1 },
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
