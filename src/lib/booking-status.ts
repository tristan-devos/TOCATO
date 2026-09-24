import type { Booking, BookingStatus, TimeSlotId } from '@/lib/types';

type Tone = 'primary' | 'success' | 'warning' | 'destructive' | 'neutral';

export const BOOKING_STATUS: Record<BookingStatus, { tone: Tone }> = {
  pending: { tone: 'warning' },
  confirmed: { tone: 'primary' },
  in_progress: { tone: 'primary' },
  completed: { tone: 'success' },
  cancelled: { tone: 'neutral' },
};

/**
 * Statuses where the client can still cancel: before the provider has started
 * (mirrors cancel_booking in supabase/transitions.sql).
 */
export function isCancellableStatus(status: BookingStatus): boolean {
  return status === 'pending' || status === 'confirmed';
}

/** Statuses where the booking is still active. */
export function isActiveStatus(status: BookingStatus): boolean {
  return status === 'pending' || status === 'confirmed' || status === 'in_progress';
}

/**
 * Phrase humaine sous le statut, côté client (docs/experience-emotionnelle.md §7) :
 * « 2 offres reçues », « Marc interviendra demain (matin) ». Le texte est composé par
 * hooks/use-status-line.ts ; ici, seulement la règle.
 */
export type StatusLine =
  | { key: 'waiting' }
  | { key: 'offers'; count: number }
  | { key: 'confirmed'; day: 'today' | 'tomorrow' | 'date'; date: string; slot?: TimeSlotId }
  | { key: 'confirmedAsap' }
  | { key: 'inProgress' }
  | { key: 'completed' }
  | { key: 'cancelled' };

export function statusLine(
  booking: Booking,
  offerCount: number,
  todayKey: string,
  tomorrowKey: string,
): StatusLine {
  switch (booking.status) {
    case 'pending':
      return offerCount > 0 ? { key: 'offers', count: offerCount } : { key: 'waiting' };
    case 'confirmed': {
      const date = booking.scheduledDate;
      if (!date) return { key: 'confirmedAsap' };
      const day = date === todayKey ? 'today' : date === tomorrowKey ? 'tomorrow' : 'date';
      return { key: 'confirmed', day, date, slot: booking.timeSlot };
    }
    case 'in_progress':
      return { key: 'inProgress' };
    case 'completed':
      return { key: 'completed' };
    case 'cancelled':
      return { key: 'cancelled' };
  }
}
