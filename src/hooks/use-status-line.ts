import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useFormats } from '@/hooks/use-formats';
import { statusLine } from '@/lib/booking-status';
import { addDays, toDateKey } from '@/lib/calendar';
import { useProviders } from '@/lib/providers-store';
import { useAppStore } from '@/lib/store';
import type { Booking } from '@/lib/types';

/** Phrase de statut d'une réservation, côté client, dans la langue active. */
export function useStatusLine(): (booking: Booking) => string {
  const { t } = useTranslation();
  const { formatDateLong } = useFormats();
  const conversations = useAppStore((s) => s.conversations);
  const providers = useProviders();

  return useCallback(
    (booking: Booking) => {
      const today = new Date();
      const offerCount = conversations.filter((c) => c.bookingId === booking.id).length;
      const line = statusLine(booking, offerCount, toDateKey(today), toDateKey(addDays(today, 1)));
      const name =
        providers.find((p) => p.id === booking.providerId)?.name ?? t('common.provider');
      switch (line.key) {
        case 'offers':
          return t('statusLine.offers', { count: line.count });
        case 'confirmed': {
          const day = line.day === 'date' ? formatDateLong(line.date) : t(`statusLine.${line.day}`);
          const slot = line.slot ? ` (${t(`timeSlots.${line.slot}`).toLowerCase()})` : '';
          return t('statusLine.confirmed', { name, when: `${day}${slot}` });
        }
        case 'confirmedAsap':
        case 'inProgress':
          return t(`statusLine.${line.key}`, { name });
        default:
          return t(`statusLine.${line.key}`);
      }
    },
    [t, formatDateLong, conversations, providers],
  );
}
