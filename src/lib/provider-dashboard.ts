/**
 * Calculs du tableau de bord prestataire (onglet Accueil,
 * docs/experience-emotionnelle.md §6). Fonctions pures : l'écran les appelle via
 * hooks/use-provider-dashboard.ts.
 *
 * Les réservations visibles par un prestataire sont celles où il a été retenu
 * (RLS) : toutes ses missions, quel que soit leur statut.
 */

import { toDateKey } from '@/lib/calendar';
import type { Booking, Message, TimeSlotId } from '@/lib/types';

const SLOT_ORDER: Record<TimeSlotId, number> = { morning: 0, afternoon: 1, evening: 2 };

/** Mission encore à faire (retenue, pas terminée ni annulée). */
function isUpcoming(booking: Booking): boolean {
  return booking.status === 'confirmed' || booking.status === 'in_progress';
}

/** Par date puis créneau ; les missions sans date (« dès que possible ») en dernier. */
export function compareMissions(a: Booking, b: Booking): number {
  const dateA = a.scheduledDate ?? '9999-12-31';
  const dateB = b.scheduledDate ?? '9999-12-31';
  if (dateA !== dateB) return dateA.localeCompare(dateB);
  const slotA = a.timeSlot ? SLOT_ORDER[a.timeSlot] : 3;
  const slotB = b.timeSlot ? SLOT_ORDER[b.timeSlot] : 3;
  return slotA - slotB;
}

export interface DashboardSummary {
  /** Mission en cours, sinon la prochaine confirmée (une date passée d'abord : en retard). */
  nextMission: Booking | undefined;
  upcomingCount: number;
  /** Devis envoyés par le prestataire, sans réponse du client. */
  pendingQuoteCount: number;
  /** Montant des devis acceptés des missions terminées ce mois-ci (pas un encaissement). */
  completedThisMonth: number;
  /** Missions datées par jour (`YYYY-MM-DD`), terminées comprises, triées par créneau. */
  missionsByDay: Map<string, Booking[]>;
  /** Missions à faire sans date (« dès que possible ») : jamais placées sur un jour inventé. */
  unscheduled: Booking[];
  /** Aucune mission ni devis : prestataire qui débute. */
  isNewProvider: boolean;
}

export function summarizeDashboard(
  bookings: Booking[],
  messages: Message[],
  now: Date,
): DashboardSummary {
  const upcoming = bookings.filter(isUpcoming);
  const inProgress = upcoming.filter((b) => b.status === 'in_progress').sort(compareMissions);
  const confirmed = upcoming.filter((b) => b.status === 'confirmed').sort(compareMissions);

  const monthPrefix = toDateKey(now).slice(0, 7);
  const completedThisMonth = bookings
    .filter(
      (b) =>
        b.status === 'completed' &&
        b.completedAt !== undefined &&
        toDateKey(new Date(b.completedAt)).startsWith(monthPrefix),
    )
    .reduce((sum, b) => sum + (b.agreedPrice ?? 0), 0);

  const missionsByDay = new Map<string, Booking[]>();
  for (const booking of [...bookings].sort(compareMissions)) {
    if (!booking.scheduledDate || booking.status === 'cancelled') continue;
    const day = missionsByDay.get(booking.scheduledDate) ?? [];
    day.push(booking);
    missionsByDay.set(booking.scheduledDate, day);
  }

  const quoteMessages = messages.filter((m) => m.type === 'quote' && m.senderId === 'me');
  const pendingQuoteCount = quoteMessages.filter((m) => m.quote?.status === 'pending').length;

  return {
    nextMission: inProgress[0] ?? confirmed[0],
    upcomingCount: upcoming.length,
    pendingQuoteCount,
    completedThisMonth,
    missionsByDay,
    unscheduled: upcoming.filter((b) => !b.scheduledDate),
    isNewProvider: bookings.length === 0 && quoteMessages.length === 0,
  };
}

/** Moment de la journée pour la salutation. */
export function greetingPeriod(now: Date): 'morning' | 'evening' {
  return now.getHours() < 17 ? 'morning' : 'evening';
}
