/**
 * Global TOCATO store (Zustand + AsyncStorage persistence).
 *
 * Holds all dynamic state: bookings, conversations, messages, user profile.
 * Provider responses are simulated with timers — these will be replaced by
 * the real-time backend.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  CANNED_REPLIES,
  newId,
  providersForService,
  SEED_BOOKINGS,
  SEED_CONVERSATIONS,
  SEED_MESSAGES,
} from '@/lib/mock-data';
import { useProfileStore } from '@/lib/profile-store';
import { estimatePrice } from '@/lib/services';
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
  /** Currently open conversation — its incoming messages don't count as unread. */
  activeConversationId: string | null;

  createBooking: (draft: BookingDraft) => { bookingId: string; conversationId: string };
  cancelBooking: (bookingId: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
  respondToQuote: (messageId: string, accept: boolean) => void;
  markConversationRead: (conversationId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  resetDemo: () => void;
}

const seedState = {
  bookings: SEED_BOOKINGS,
  conversations: SEED_CONVERSATIONS,
  messages: SEED_MESSAGES,
  activeConversationId: null as string | null,
};

/** Appends a message and updates the conversation (sort + unread count). */
function appendMessage(
  state: Pick<AppState, 'messages' | 'conversations' | 'activeConversationId'>,
  message: Message,
) {
  const fromProvider = message.senderId !== 'me' && message.senderId !== 'system';
  const isActive = state.activeConversationId === message.conversationId;
  return {
    messages: [...state.messages, message],
    conversations: state.conversations.map((c) =>
      c.id === message.conversationId
        ? {
            ...c,
            lastMessageAt: message.createdAt,
            unreadCount: fromProvider && !isActive ? c.unreadCount + 1 : c.unreadCount,
          }
        : c,
    ),
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const pushMessage = (message: Message) => set((state) => appendMessage(state, message));

      /** Simulated provider reply, delivered after a delay. */
      const scheduleProviderMessage = (
        message: Omit<Message, 'id' | 'createdAt'>,
        delayMs: number,
      ) => {
        setTimeout(() => {
          // The conversation may have been wiped by a demo reset.
          if (!get().conversations.some((c) => c.id === message.conversationId)) return;
          pushMessage({ ...message, id: newId('m'), createdAt: new Date().toISOString() });
        }, delayMs);
      };

      return {
        ...seedState,

        createBooking: (draft) => {
          const bookingId = newId('b');
          const conversationId = newId('c');
          const now = new Date().toISOString();

          // Demo: assign the highest-rated provider for the service,
          // cycling through candidates to vary the demo. Real matching
          // will come from the backend.
          const candidates = providersForService(draft.serviceId);
          const provider = candidates[get().bookings.length % candidates.length];
          if (!provider) {
            throw new Error(`No provider available for ${draft.serviceId}`);
          }

          const booking: Booking = {
            id: bookingId,
            serviceId: draft.serviceId,
            status: 'pending',
            createdAt: now,
            scheduledDate: draft.scheduledDate,
            timeSlot: draft.timeSlot,
            address: draft.address,
            answers: draft.answers,
            description: draft.description,
            photoCount: draft.photoCount,
            estimate: estimatePrice(draft.serviceId),
            providerId: provider.id,
            conversationId,
          };

          const conversation: Conversation = {
            id: conversationId,
            providerId: provider.id,
            bookingId,
            unreadCount: 0,
            lastMessageAt: now,
          };

          set((state) => ({
            bookings: [booking, ...state.bookings],
            conversations: [conversation, ...state.conversations],
            messages: [
              ...state.messages,
              {
                id: newId('m'),
                conversationId,
                senderId: 'system',
                type: 'system',
                text: `Votre demande a été envoyée à ${provider.name}.`,
                createdAt: now,
              },
            ],
          }));

          const firstName = (useProfileStore.getState().profile?.name ?? '').split(' ')[0];
          scheduleProviderMessage(
            {
              conversationId,
              senderId: provider.id,
              type: 'text',
              text: `Bonjour ${firstName} ! J'ai bien reçu votre demande, je la regarde et je vous envoie un devis rapidement.`,
            },
            2_500,
          );

          const { min, max } = booking.estimate;
          const quoteAmount = Math.round((min + max) / 2 / 5) * 5;
          scheduleProviderMessage(
            {
              conversationId,
              senderId: provider.id,
              type: 'quote',
              text: 'Voici mon devis détaillé pour votre demande.',
              quote: {
                amount: quoteAmount,
                details:
                  "Main-d'œuvre, déplacement et matériel de base inclus. Ajustable après visite si besoin.",
                status: 'pending',
              },
            },
            9_000,
          );

          return { bookingId, conversationId };
        },

        cancelBooking: (bookingId) => {
          const booking = get().bookings.find((b) => b.id === bookingId);
          if (!booking || booking.status === 'cancelled' || booking.status === 'completed')
            return;

          set((state) => ({
            bookings: state.bookings.map((b) =>
              b.id === bookingId ? { ...b, status: 'cancelled' } : b,
            ),
          }));
          pushMessage({
            id: newId('m'),
            conversationId: booking.conversationId,
            senderId: 'system',
            type: 'system',
            text: 'Vous avez annulé cette réservation.',
            createdAt: new Date().toISOString(),
          });
        },

        sendMessage: (conversationId, text) => {
          const trimmed = text.trim();
          if (!trimmed) return;

          pushMessage({
            id: newId('m'),
            conversationId,
            senderId: 'me',
            type: 'text',
            text: trimmed,
            createdAt: new Date().toISOString(),
          });

          const conversation = get().conversations.find((c) => c.id === conversationId);
          if (!conversation) return;
          const replyIndex = get().messages.filter((m) => m.senderId === 'me').length;
          scheduleProviderMessage(
            {
              conversationId,
              senderId: conversation.providerId,
              type: 'text',
              text: CANNED_REPLIES[replyIndex % CANNED_REPLIES.length] ?? 'Bien reçu, merci !',
            },
            2_000 + Math.random() * 1_500,
          );
        },

        respondToQuote: (messageId, accept) => {
          const message = get().messages.find((m) => m.id === messageId);
          if (!message?.quote || message.quote.status !== 'pending') return;

          const status = accept ? 'accepted' : 'declined';
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === messageId ? { ...m, quote: { ...m.quote!, status } } : m,
            ),
          }));

          const conversation = get().conversations.find(
            (c) => c.id === message.conversationId,
          );
          if (!conversation) return;

          if (accept) {
            set((state) => ({
              bookings: state.bookings.map((b) =>
                b.id === conversation.bookingId
                  ? { ...b, status: 'confirmed', agreedPrice: message.quote!.amount }
                  : b,
              ),
            }));
          }
          pushMessage({
            id: newId('m'),
            conversationId: message.conversationId,
            senderId: 'system',
            type: 'system',
            text: accept ? 'Devis accepté — votre réservation est confirmée.' : 'Vous avez refusé le devis.',
            createdAt: new Date().toISOString(),
          });
        },

        markConversationRead: (conversationId) => {
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId && c.unreadCount > 0 ? { ...c, unreadCount: 0 } : c,
            ),
          }));
        },

        setActiveConversation: (conversationId) => {
          set({ activeConversationId: conversationId });
          if (conversationId) get().markConversationRead(conversationId);
        },

        resetDemo: () => set({ ...seedState }),
      };
    },
    {
      name: 'tocato-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookings: state.bookings,
        conversations: state.conversations,
        messages: state.messages,
      }),
    },
  ),
);

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
