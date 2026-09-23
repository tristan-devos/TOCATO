/**
 * Store applicatif (réservations, conversations, messages) adossé à Supabase.
 *
 * Source de vérité = la base. Le store charge les données à la connexion
 * (`loadAll`, appelé depuis auth-store), écoute le Realtime et réécrit via
 * Supabase. Seul l'envoi d'un message texte est un insert direct : toute
 * transition d'état (devis, annulation, photos, lu) passe par une RPC qui
 * vérifie les droits côté serveur (voir supabase/transitions.sql). La simulation des réponses prestataire vit côté serveur (Edge
 * Function `provider-reply`), déclenchée via `provider-reply.ts`. Les sélecteurs
 * exposés restent identiques pour ne pas toucher les écrans.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { create } from 'zustand';

import { rowToBooking, rowToConversation, rowToMessage } from '@/lib/db-mappers';
import { providersForService } from '@/lib/mock-data';
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
  /** Prestataire choisi par le client ; absent = attribution automatique. */
  providerId?: string;
}

interface AppState {
  bookings: Booking[];
  conversations: Conversation[];
  messages: Message[];
  /** Currently open conversation — used to mark incoming messages as read. */
  activeConversationId: string | null;

  loadAll: () => Promise<void>;
  clearAll: () => void;
  createBooking: (
    draft: BookingDraft,
  ) => Promise<{ bookingId: string; conversationId: string } | null>;
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
    // Le client choisit un prestataire ; sinon attribution auto (rotation démo).
    const candidates = providersForService(draft.serviceId);
    const chosen = draft.providerId
      ? candidates.find((p) => p.id === draft.providerId)
      : undefined;
    const provider = chosen ?? candidates[get().bookings.length % candidates.length];
    if (!provider) return null;

    const estimate = estimatePrice(draft.serviceId);
    const { data, error } = await supabase.rpc('create_booking', {
      p_service_id: draft.serviceId,
      p_scheduled_date: draft.scheduledDate ?? null,
      p_time_slot: draft.timeSlot ?? null,
      p_address: draft.address,
      p_answers: draft.answers,
      p_description: draft.description,
      p_photos: [],
      p_estimate_min: estimate.min,
      p_estimate_max: estimate.max,
      p_provider_id: provider.id,
    });
    const result = data?.[0];
    if (error || !result) return null;

    // Upload des photos après création (le booking_id sert de dossier Storage),
    // puis on rattache les chemins à la réservation. Best-effort : un échec
    // d'upload n'invalide pas la réservation déjà créée.
    if (draft.photos.length > 0) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (userId) {
        const paths = await uploadBookingPhotos(userId, result.booking_id, draft.photos);
        if (paths.length > 0) {
          const { error: photosError } = await supabase.rpc('set_booking_photos', {
            p_booking_id: result.booking_id,
            p_photos: paths,
          });
          if (photosError && __DEV__) console.warn('[set_booking_photos]', photosError.message);
        }
      }
    }

    await Promise.all([refreshBookings(), refreshConversations(), refreshMessages()]);
    triggerProviderReply(result.conversation_id, 'initial');
    return { bookingId: result.booking_id, conversationId: result.conversation_id };
  },

  cancelBooking: async (bookingId) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status === 'cancelled' || booking.status === 'completed') return;

    const { error } = await supabase.rpc('cancel_booking', { p_booking_id: bookingId });
    if (error && __DEV__) console.warn('[cancel_booking]', error.message);
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

    triggerProviderReply(conversationId, 'canned');
  },

  respondToQuote: async (messageId, accept) => {
    const message = get().messages.find((m) => m.id === messageId);
    if (!message?.quote || message.quote.status !== 'pending') return;

    // Le serveur applique la transition complète (devis, réservation, message
    // système) et refuse un devis déjà traité ou une réservation non en attente.
    const { error } = await supabase.rpc(accept ? 'accept_quote' : 'decline_quote', {
      p_message_id: messageId,
    });
    if (error && __DEV__) console.warn('[respondToQuote]', error.message);
    await Promise.all([refreshBookings(), refreshMessages()]);
  },

  markConversationRead: async (conversationId) => {
    const conversation = get().conversations.find((c) => c.id === conversationId);
    if (!conversation || conversation.unreadCount === 0) return;
    await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId });
    await refreshConversations();
  },

  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
    if (conversationId) void get().markConversationRead(conversationId);
  },

  resetDemo: async () => {
    const { error } = await supabase.rpc('seed_demo');
    if (error && __DEV__) console.warn('[seed_demo]', error.message);
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
