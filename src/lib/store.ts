/**
 * Store applicatif (réservations, conversations, messages) adossé à Supabase.
 *
 * Source de vérité = la base. Le store charge les données à la connexion
 * (`loadAll`, appelé depuis auth-store), écoute le Realtime et réécrit via
 * Supabase. Flux multi-prestataires : la demande est créée sans prestataire ;
 * ce sont les prestataires qui ouvrent chacun une conversation (simulation côté
 * serveur, Edge Function `provider-reply` déclenchée via `provider-reply.ts`),
 * et l'acceptation d'un devis fixe le prestataire de la réservation.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { create } from 'zustand';

import { rowToBooking, rowToConversation, rowToMessage } from '@/lib/db-mappers';
import { type LocalPhoto, uploadBookingPhotos } from '@/lib/photo-upload';
import { triggerProviderReply } from '@/lib/provider-reply';
import { estimatePrice } from '@/lib/services';
import { supabase } from '@/lib/supabase';
import type {
  Address,
  Booking,
  BookingAnswer,
  Conversation,
  Message,
  ServiceId,
  TimeSlotId,
} from '@/lib/types';

export interface BookingDraft {
  serviceId: ServiceId;
  answers: BookingAnswer[];
  description: string;
  photos: LocalPhoto[];
  address: Address;
  scheduledDate?: string;
  timeSlot?: TimeSlotId;
}

interface AppState {
  bookings: Booking[];
  conversations: Conversation[];
  messages: Message[];
  /** Currently open conversation — used to mark incoming messages as read. */
  activeConversationId: string | null;

  loadAll: () => Promise<void>;
  clearAll: () => void;
  createBooking: (draft: BookingDraft) => Promise<{ bookingId: string } | null>;
  cancelBooking: (bookingId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  respondToQuote: (messageId: string, accept: boolean) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  resetDemo: () => Promise<void>;
}

// ——— Lectures (RLS restreint déjà aux données de l'utilisateur) ———

async function fetchBookings(): Promise<Booking[]> {
  const { data } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []).map(rowToBooking);
}

async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await supabase.from('conversations').select('*');
  return (data ?? []).map(rowToConversation);
}

async function fetchMessages(): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });
  return (data ?? []).map(rowToMessage);
}

async function refreshBookings(): Promise<void> {
  useAppStore.setState({ bookings: await fetchBookings() });
}
async function refreshConversations(): Promise<void> {
  useAppStore.setState({ conversations: await fetchConversations() });
}
async function refreshMessages(): Promise<void> {
  useAppStore.setState({ messages: await fetchMessages() });
}

// ——— Realtime : tout changement déclenche un rechargement ciblé ———

let channel: RealtimeChannel | null = null;

function subscribe(): void {
  if (channel) return;
  channel = supabase
    .channel('tocato-db')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
      void refreshBookings();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
      void refreshConversations();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
      void refreshMessages();
    })
    .subscribe();
}

function unsubscribe(): void {
  if (channel) {
    void supabase.removeChannel(channel);
    channel = null;
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  bookings: [],
  conversations: [],
  messages: [],
  activeConversationId: null,

  loadAll: async () => {
    const [bookings, conversations, messages] = await Promise.all([
      fetchBookings(),
      fetchConversations(),
      fetchMessages(),
    ]);
    set({ bookings, conversations, messages });
    subscribe();
  },

  clearAll: () => {
    unsubscribe();
    set({ bookings: [], conversations: [], messages: [], activeConversationId: null });
  },

  createBooking: async (draft) => {
    // La demande est créée sans prestataire : les prestataires intéressés
    // ouvriront chacun leur conversation (Edge Function provider-reply).
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return null;

    const estimate = estimatePrice(draft.serviceId);
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        service_id: draft.serviceId,
        scheduled_date: draft.scheduledDate ?? null,
        time_slot: draft.timeSlot ?? null,
        address: draft.address,
        answers: draft.answers,
        description: draft.description,
        estimate_min: estimate.min,
        estimate_max: estimate.max,
      })
      .select('id')
      .single();
    if (error || !data) return null;
    const bookingId = data.id;

    // Upload des photos après création (le booking_id sert de dossier Storage),
    // puis on rattache les chemins à la réservation. Best-effort : un échec
    // d'upload n'invalide pas la réservation déjà créée.
    if (draft.photos.length > 0) {
      const paths = await uploadBookingPhotos(userId, bookingId, draft.photos);
      if (paths.length > 0) {
        await supabase.from('bookings').update({ photos: paths }).eq('id', bookingId);
      }
    }

    await refreshBookings();
    triggerProviderReply({ kind: 'initial', bookingId });
    return { bookingId };
  },

  cancelBooking: async (bookingId) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status === 'cancelled' || booking.status === 'completed') return;

    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    // Tous les prestataires en conversation sur cette demande sont prévenus.
    const conversations = get().conversations.filter((c) => c.bookingId === bookingId);
    if (conversations.length > 0) {
      await supabase.from('messages').insert(
        conversations.map((c) => ({
          conversation_id: c.id,
          sender_kind: 'system' as const,
          type: 'system' as const,
          text: 'Vous avez annulé cette réservation.',
        })),
      );
    }
    await Promise.all([refreshBookings(), refreshMessages()]);
  },

  sendMessage: async (conversationId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const conversation = get().conversations.find((c) => c.id === conversationId);
    if (!conversation) return;

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_kind: 'client',
      type: 'text',
      text: trimmed,
    });
    await refreshMessages();

    triggerProviderReply({ kind: 'canned', conversationId });
  },

  respondToQuote: async (messageId, accept) => {
    const message = get().messages.find((m) => m.id === messageId);
    if (!message?.quote || message.quote.status !== 'pending') return;
    const conversation = get().conversations.find((c) => c.id === message.conversationId);
    if (!conversation) return;
    const booking = get().bookings.find((b) => b.id === conversation.bookingId);
    if (!booking) return;
    // Garde : un devis ne s'accepte que sur une demande encore ouverte
    // (pas déjà pourvue par un autre prestataire, ni annulée).
    if (accept && (booking.status !== 'pending' || booking.providerId != null)) return;

    const status = accept ? 'accepted' : 'declined';
    await supabase
      .from('messages')
      .update({ quote: { ...message.quote, status } })
      .eq('id', messageId);

    if (accept) {
      // L'acceptation fixe le prestataire de la réservation.
      await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          agreed_price: message.quote.amount,
          provider_id: conversation.providerId,
        })
        .eq('id', booking.id);

      // Les autres prestataires de la demande : devis en attente retirés,
      // et un message système les prévient (leurs conversations restent lisibles).
      const others = get().conversations.filter(
        (c) => c.bookingId === booking.id && c.id !== conversation.id,
      );
      const otherIds = new Set(others.map((c) => c.id));
      for (const pending of get().messages) {
        if (!pending.quote || pending.quote.status !== 'pending') continue;
        if (pending.id === messageId || !otherIds.has(pending.conversationId)) continue;
        await supabase
          .from('messages')
          .update({ quote: { ...pending.quote, status: 'declined' } })
          .eq('id', pending.id);
      }
      if (others.length > 0) {
        await supabase.from('messages').insert(
          others.map((c) => ({
            conversation_id: c.id,
            sender_kind: 'system' as const,
            type: 'system' as const,
            text: 'Vous avez confirmé un autre prestataire pour cette demande.',
          })),
        );
      }
    }

    await supabase.from('messages').insert({
      conversation_id: message.conversationId,
      sender_kind: 'system',
      type: 'system',
      text: accept
        ? 'Devis accepté — votre réservation est confirmée.'
        : 'Vous avez refusé le devis.',
    });
    await Promise.all([refreshBookings(), refreshMessages()]);
  },

  markConversationRead: async (conversationId) => {
    const conversation = get().conversations.find((c) => c.id === conversationId);
    if (!conversation || conversation.unreadCount === 0) return;
    await supabase.from('conversations').update({ unread_count: 0 }).eq('id', conversationId);
    await refreshConversations();
  },

  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
    if (conversationId) void get().markConversationRead(conversationId);
  },

  resetDemo: async () => {
    await supabase.rpc('seed_demo');
    await Promise.all([refreshBookings(), refreshConversations(), refreshMessages()]);
  },
}));

// ——— Selectors ———

export function useBooking(bookingId: string | undefined) {
  return useAppStore((s) => s.bookings.find((b) => b.id === bookingId));
}

export function useConversation(conversationId: string | undefined) {
  return useAppStore((s) => s.conversations.find((c) => c.id === conversationId));
}

export function useUnreadTotal() {
  return useAppStore((s) => s.conversations.reduce((sum, c) => sum + c.unreadCount, 0));
}

/** Booking to highlight on the home screen: the next active one. */
export function useHighlightedBooking() {
  return useAppStore((s) =>
    s.bookings.find(
      (b) => b.status === 'pending' || b.status === 'confirmed' || b.status === 'in_progress',
    ),
  );
}
