import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Celebration } from '@/components/celebration/celebration';

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
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Celebration
      title={t('wizard.successTitle')}
      message={t('wizard.successMessage', { service: serviceName.toLowerCase() })}
      primary={{
        label: t('wizard.viewRequest'),
        onPress: () =>
          router.replace({ pathname: '/reservation/[id]', params: { id: bookingId } }),
      }}
      secondary={{
        label: t('wizard.viewBookings'),
        onPress: () => {
          router.back();
          router.push('/(tabs)/reservations');
        },
      }}
    />
  );
}
