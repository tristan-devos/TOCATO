/**
 * Données et actions propres au rôle prestataire (adossées aux RPC de
 * `supabase/providers.sql`).
 *
 * - Demandes ouvertes de ses services (`list_open_requests`) : jamais l'adresse
 *   exacte ni le nom du client. Elles ne sont PAS poussées en temps réel (la RLS
 *   ne lui ouvre pas les lignes bookings d'une demande ouverte) : rechargées au
 *   focus de l'écran et par « tirer pour rafraîchir ».
 * - Prénom du client de chacune de ses conversations.
 * - Actions : devis, début et fin d'intervention.
 * Les conversations, messages et réservations retenues restent dans `store.ts`.
 */

import { create } from 'zustand';

import { rowToOpenRequest } from '@/lib/db-mappers';
import type { QuoteInput } from '@/lib/quote-draft';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { OpenRequest } from '@/lib/types';

interface ProviderState {
  openRequests: OpenRequest[];
  /** Prénom du client, par id de conversation. */
  clientNames: Record<string, string>;
  loadProviderData: () => Promise<void>;
  refreshOpenRequests: () => Promise<void>;
  /** Envoie un devis ; renvoie l'id de la conversation, ou null en cas d'échec. */
  /** Envoie un devis complet (quote-draft.ts) ; renvoie la conversation, ou null. */
  sendQuote: (bookingId: string, quote: QuoteInput) => Promise<string | null>;
  /** true si la transition a été appliquée. */
  startJob: (bookingId: string) => Promise<boolean>;
  completeJob: (bookingId: string) => Promise<boolean>;
  clear: () => void;
}

async function fetchOpenRequests(): Promise<OpenRequest[]> {
  const { data, error } = await supabase.rpc('list_open_requests');
  if (error && __DEV__) console.warn('[list_open_requests]', error.message);
  return (data ?? []).map(rowToOpenRequest);
}

async function fetchClientNames(): Promise<Record<string, string>> {
  const { data, error } = await supabase.rpc('provider_conversation_clients');
  if (error && __DEV__) console.warn('[provider_conversation_clients]', error.message);
  const names: Record<string, string> = {};
  for (const row of data ?? []) names[row.conversation_id] = row.client_first_name;
  return names;
}

export const useProviderStore = create<ProviderState>((set) => ({
  openRequests: [],
  clientNames: {},

  loadProviderData: async () => {
    const [openRequests, clientNames] = await Promise.all([
      fetchOpenRequests(),
      fetchClientNames(),
    ]);
    set({ openRequests, clientNames });
  },

  refreshOpenRequests: async () => {
    set({ openRequests: await fetchOpenRequests() });
  },

  sendQuote: async (bookingId, quote) => {
    const { data, error } = await supabase.rpc('send_quote', {
      p_booking_id: bookingId,
      p_lines: quote.lines,
      p_proposed_date: quote.proposedDate,
      p_proposed_slot: quote.proposedSlot,
      p_duration_hours: quote.durationHours,
      p_included: quote.included,
      p_warranty: quote.warranty,
    });
    if (error || !data) {
      if (error && __DEV__) console.warn('[send_quote]', error.message);
      return null;
    }
    // Nouvelle conversation possible : on recharge tout ce qui en dépend.
    const [openRequests, clientNames] = await Promise.all([
      fetchOpenRequests(),
      fetchClientNames(),
      useAppStore.getState().loadAll(),
    ]);
    set({ openRequests, clientNames });
    return data;
  },

  startJob: async (bookingId) => {
    const { error } = await supabase.rpc('start_job', { p_booking_id: bookingId });
    if (error && __DEV__) console.warn('[start_job]', error.message);
    await useAppStore.getState().loadAll();
    return !error;
  },

  completeJob: async (bookingId) => {
    const { error } = await supabase.rpc('complete_job', { p_booking_id: bookingId });
    if (error && __DEV__) console.warn('[complete_job]', error.message);
    await useAppStore.getState().loadAll();
    return !error;
  },

  clear: () => set({ openRequests: [], clientNames: {} }),
}));

// --- Sélecteurs ---

export function useOpenRequests(): OpenRequest[] {
  return useProviderStore((s) => s.openRequests);
}

export function useOpenRequest(requestId: string | undefined): OpenRequest | undefined {
  return useProviderStore((s) =>
    requestId ? s.openRequests.find((r) => r.id === requestId) : undefined,
  );
}

export function useClientName(conversationId: string | undefined): string | undefined {
  return useProviderStore((s) => (conversationId ? s.clientNames[conversationId] : undefined));
}
