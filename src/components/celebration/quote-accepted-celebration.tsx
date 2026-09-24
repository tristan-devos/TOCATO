import { useTranslation } from 'react-i18next';

import { CelebrationModal } from '@/components/celebration/celebration';
import { useMissionWhen } from '@/hooks/use-mission-when';
import type { Booking } from '@/lib/types';

interface QuoteAcceptedCelebrationProps {
  visible: boolean;
  providerName: string;
  /** Réservation confirmée (date et créneau pour le message). */
  booking: Booking | undefined;
  onClose: () => void;
}

/** « C'est réglé ! Marc interviendra jeudi 25 septembre · matin. » (client, devis accepté). */
export function QuoteAcceptedCelebration({
  visible,
  providerName,
  booking,
  onClose,
}: QuoteAcceptedCelebrationProps) {
  const { t } = useTranslation();
  const missionWhen = useMissionWhen();
  const when = booking?.scheduledDate ? missionWhen(booking) : null;
  return (
    <CelebrationModal
      visible={visible}
      title={t('celebrate.quoteAcceptedTitle')}
      message={
        when
          ? t('celebrate.quoteAcceptedMessage', { name: providerName, when })
          : t('celebrate.quoteAcceptedAsap', { name: providerName })
      }
      closeLabel={t('celebrate.continue')}
      onClose={onClose}
    />
  );
}
