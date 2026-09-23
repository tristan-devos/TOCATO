import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface BookingSuccessProps {
  bookingId: string;
  /** Nom de catégorie du service (déjà localisé), pour le message de succès. */
  serviceName: string;
}

/**
 * Écran de confirmation affiché après l'envoi d'une demande de réservation.
 * Aucun prestataire n'est encore attribué : les prestataires intéressés
 * contacteront le client dans Messages, chacun avec son offre.
 */
export function BookingSuccess({ bookingId, serviceName }: BookingSuccessProps) {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

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
      </View>
      <View style={styles.footer}>
        <Button
          title={t('wizard.viewRequest')}
          size="lg"
          onPress={() =>
            router.replace({ pathname: '/reservation/[id]', params: { id: bookingId } })
          }
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
  centered: { textAlign: 'center' },
  footer: {
    padding: Spacing.three,
    paddingBottom: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
});
