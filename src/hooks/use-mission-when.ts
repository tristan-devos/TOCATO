import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useFormats } from '@/hooks/use-formats';
import type { Booking } from '@/lib/types';

/** « jeudi 25 septembre · matin », ou « Dès que possible » sans date. */
export function useMissionWhen(): (booking: Booking) => string {
  const { t } = useTranslation();
  const { formatDateLong } = useFormats();
  return useCallback(
    (booking: Booking) => {
      if (!booking.scheduledDate) return t('common.asap');
      const date = formatDateLong(booking.scheduledDate);
      return booking.timeSlot
        ? `${date} · ${t(`timeSlots.${booking.timeSlot}`).toLowerCase()}`
        : date;
    },
    [t, formatDateLong],
  );
}
