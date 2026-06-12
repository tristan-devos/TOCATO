import type { BookingStatus } from '@/lib/types';

type Tone = 'primary' | 'success' | 'warning' | 'destructive' | 'neutral';

export const BOOKING_STATUS: Record<BookingStatus, { label: string; tone: Tone }> = {
  pending: { label: 'En attente', tone: 'warning' },
  confirmed: { label: 'Confirmée', tone: 'primary' },
  in_progress: { label: 'En cours', tone: 'primary' },
  completed: { label: 'Terminée', tone: 'success' },
  cancelled: { label: 'Annulée', tone: 'neutral' },
};

/** Statuts pour lesquels la réservation est encore « vivante ». */
export function isActiveStatus(status: BookingStatus): boolean {
  return status === 'pending' || status === 'confirmed' || status === 'in_progress';
}
