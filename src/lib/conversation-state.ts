/**
 * Peut-on encore écrire dans une conversation ? Miroir côté app de
 * conversation_open (supabase/reviews.sql), qui fait foi : ici, seulement pour
 * afficher la zone de saisie ou le bandeau « conversation fermée »
 * (docs/devis-et-fin-de-mission.md §6).
 */

import type { Booking, Conversation } from '@/lib/types';

/** Délai d'écriture après la fin de l'intervention (chat_grace, reviews.sql). */
export const CHAT_GRACE_HOURS = 48;
/** Délai pour noter le prestataire (review_window, reviews.sql). */
export const REVIEW_WINDOW_DAYS = 30;

const HOUR_MS = 60 * 60 * 1000;

/** `unavailable` : prestataire qui ne lit plus la demande (confiée à un autre, ou annulée). */
export type ClosedReason = 'completed' | 'cancelled' | 'otherProvider' | 'unavailable';

export type ConversationState =
  | { open: true; closesAt?: Date }
  | { open: false; reason: ClosedReason };

/**
 * `booking` : la réservation si le lecteur peut la lire (client, ou prestataire
 * retenu). `openRequest` : côté prestataire, la demande est encore ouverte.
 */
export function conversationState(
  conversation: Conversation,
  booking: Booking | undefined,
  openRequest: boolean,
  now: Date,
): ConversationState {
  if (!booking) {
    // Prestataire sans ligne bookings lisible : demande ouverte, sinon confiée à un
    // autre ou annulée (il ne peut pas savoir laquelle).
    return openRequest ? { open: true } : { open: false, reason: 'unavailable' };
  }
  if (booking.status === 'pending') return { open: true };
  if (booking.status === 'cancelled') return { open: false, reason: 'cancelled' };
  if (booking.providerId !== conversation.providerId) {
    return { open: false, reason: 'otherProvider' };
  }
  if (booking.status === 'completed') {
    if (!booking.completedAt) return { open: false, reason: 'completed' };
    const closesAt = new Date(Date.parse(booking.completedAt) + CHAT_GRACE_HOURS * HOUR_MS);
    return closesAt > now ? { open: true, closesAt } : { open: false, reason: 'completed' };
  }
  return { open: true };
}

/** La note est-elle encore possible pour cette intervention ? */
export function reviewWindowOpen(booking: Booking | undefined, now: Date): boolean {
  if (!booking?.completedAt) return false;
  return Date.parse(booking.completedAt) + REVIEW_WINDOW_DAYS * 24 * HOUR_MS > now.getTime();
}
