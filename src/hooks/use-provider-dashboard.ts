import { useCallback, useMemo } from 'react';

import { useCounterpartName } from '@/hooks/use-counterpart';
import { summarizeDashboard, type DashboardSummary } from '@/lib/provider-dashboard';
import { useAppStore } from '@/lib/store';
import type { Booking } from '@/lib/types';

interface ProviderDashboard extends DashboardSummary {
  /** Prénom du client d'une mission (via sa conversation), '' si inconnu. */
  clientNameFor: (booking: Booking) => string;
}

/**
 * Données de l'onglet Accueil prestataire. `now` vient de l'écran (rafraîchi à
 * chaque ouverture) : le calcul reste pur, et « ce mois-ci » suit le calendrier.
 */
export function useProviderDashboard(now: Date): ProviderDashboard {
  const bookings = useAppStore((s) => s.bookings);
  const messages = useAppStore((s) => s.messages);
  const conversations = useAppStore((s) => s.conversations);
  const counterpartName = useCounterpartName();

  const summary = useMemo(
    () => summarizeDashboard(bookings, messages, now),
    [bookings, messages, now],
  );

  const clientNameFor = useCallback(
    (booking: Booking) => {
      const conversation = conversations.find((c) => c.bookingId === booking.id);
      return conversation ? counterpartName(conversation) : '';
    },
    [conversations, counterpartName],
  );

  return { ...summary, clientNameFor };
}
