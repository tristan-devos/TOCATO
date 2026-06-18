import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ProviderRow } from '@/components/provider-row';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getProvider } from '@/lib/mock-data';
import { useAppStore } from '@/lib/store';

interface BookingSuccessProps {
  bookingId: string;
  conversationId: string;
  /** Nom de catégorie du service (déjà localisé), pour le message de succès. */
  serviceName: string;
}

/** Écran de confirmation affiché après l'envoi d'une demande de réservation. */
export function BookingSuccess({ bookingId, conversationId, serviceName }: BookingSuccessProps) {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const booking = useAppStore((s) => s.bookings.find((b) => b.id === bookingId));
  const provider = booking ? getProvider(booking.providerId) : undefined;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.success}>
        <CheckCircle2 size={64} color={colors.success} />
        <AppText variant="heading" style={styles.centered}>
          {t('wizard.successTitle')}
        </AppText>
        <AppText variant="secondary" style={styles.centered}>
          {t('wizard.successMessage', { service: serviceName.toLowerCase() })}
        </AppText>
        {provider ? (
          <Card style={styles.successProvider}>
            <ProviderRow provider={provider} />
          </Card>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Button
          title={t('common.openChat')}
          size="lg"
          onPress={() => router.replace({ pathname: '/chat/[id]', params: { id: conversationId } })}
        />
        <Button
          title={t('wizard.viewBookings')}
          variant="ghost"
          onPress={() => {
            router.back();
            router.push('/(tabs)/reservations');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  success: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.five,
  },
  successProvider: { alignSelf: 'stretch', marginTop: Spacing.three, borderRadius: Radius.lg },
  centered: { textAlign: 'center' },
  footer: {
    padding: Spacing.three,
    paddingBottom: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
});
