import type { BookingStatus } from '@/lib/types';

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
