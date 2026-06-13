/**
 * Store applicatif (réservations, conversations, messages) adossé à Supabase.
 *
 * Source de vérité = la base. Le store charge les données à la connexion
 * (`loadAll`, appelé depuis auth-store), écoute le Realtime et réécrit via
 * Supabase. La simulation des réponses prestataire vit dans `provider-sim.ts`
 * (vouée à devenir une Edge Function). Les sélecteurs exposés restent
 * identiques pour ne pas toucher les écrans.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { create } from 'zustand';

import { rowToBooking, rowToConversation, rowToMessage } from '@/lib/db-mappers';
import { providersForService } from '@/lib/mock-data';
import { useProfileStore } from '@/lib/profile-store';
import { simulateCannedReply, simulateInitialReply } from '@/lib/provider-sim';
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
  photoCount: number;
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
    // Demo: assign a provider for the service, cycling to vary the demo.
    const candidates = providersForService(draft.serviceId);
    const provider = candidates[get().bookings.length % candidates.length];
    if (!provider) return null;

    const estimate = estimatePrice(draft.serviceId);
    const { data, error } = await supabase.rpc('create_booking', {
      p_service_id: draft.serviceId,
      p_scheduled_date: draft.scheduledDate ?? null,
      p_time_slot: draft.timeSlot ?? null,
      p_address: draft.address,
      p_answers: draft.answers,
      p_description: draft.description,
      p_photo_count: draft.photoCount,
      p_estimate_min: estimate.min,
      p_estimate_max: estimate.max,
      p_provider_id: provider.id,
    });
    const result = data?.[0];
    if (error || !result) return null;

    await Promise.all([refreshBookings(), refreshConversations(), refreshMessages()]);
    const firstName = (useProfileStore.getState().profile?.name ?? '').split(' ')[0] ?? '';
    simulateInitialReply(result.conversation_id, provider.id, firstName, estimate);
    return { bookingId: result.booking_id, conversationId: result.conversation_id };
  },

  cancelBooking: async (bookingId) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status === 'cancelled' || booking.status === 'completed') return;

    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    await supabase.from('messages').insert({
      conversation_id: booking.conversationId,
      sender_kind: 'system',
      type: 'system',
      text: 'Vous avez annulé cette réservation.',
    });
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

    const replyIndex = get().messages.filter((m) => m.senderId === 'me').length;
    simulateCannedReply(conversationId, conversation.providerId, replyIndex);
  },

  respondToQuote: async (messageId, accept) => {
    const message = get().messages.find((m) => m.id === messageId);
    if (!message?.quote || message.quote.status !== 'pending') return;
    const conversation = get().conversations.find((c) => c.id === message.conversationId);
    if (!conversation) return;

    const status = accept ? 'accepted' : 'declined';
    await supabase
      .from('messages')
      .update({ quote: { ...message.quote, status } })
      .eq('id', messageId);
    if (accept) {
      await supabase
        .from('bookings')
        .update({ status: 'confirmed', agreed_price: message.quote.amount })
        .eq('id', conversation.bookingId);
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
