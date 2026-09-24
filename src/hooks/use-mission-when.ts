import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useFormats } from '@/hooks/use-formats';
import type { Booking } from '@/lib/types';

/** Une date et un créneau : une mission, ou la date proposée dans un devis. */
type When = Pick<Booking, 'scheduledDate' | 'timeSlot'>;

/** « jeudi 25 septembre · matin », ou « Dès que possible » sans date. */
export function useMissionWhen(): (when: When) => string {
  const { t } = useTranslation();
  const { formatDateLong } = useFormats();
  return useCallback(
    (booking: When) => {
      if (!booking.scheduledDate) return t('common.asap');
      const date = formatDateLong(booking.scheduledDate);
      return booking.timeSlot
        ? `${date} · ${t(`timeSlots.${booking.timeSlot}`).toLowerCase()}`
        : date;
    },
    [t, formatDateLong],
  );
}
