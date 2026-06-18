/**
 * Conversion lignes Supabase -> types du domaine (`@/lib/types`).
 * Les écrans ne manipulent que les types du domaine ; ces fonctions sont la
 * frontière unique entre le schéma DB et l'application.
 */

import type { Database } from '@/lib/database.types';
import type { Booking, Conversation, Message } from '@/lib/types';

type BookingRow = Database['public']['Tables']['bookings']['Row'];
type ConversationRow = Database['public']['Tables']['conversations']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];

export function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    serviceId: row.service_id,
    status: row.status,
    createdAt: row.created_at,
    scheduledDate: row.scheduled_date ?? undefined,
    timeSlot: row.time_slot ?? undefined,
    address: row.address,
    answers: row.answers,
    description: row.description,
    photoCount: row.photo_count,
    estimate: { min: row.estimate_min, max: row.estimate_max },
    agreedPrice: row.agreed_price ?? undefined,
    providerId: row.provider_id,
    conversationId: row.conversation_id,
  };
}

export function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    providerId: row.provider_id,
    bookingId: row.booking_id,
    unreadCount: row.unread_count,
    lastMessageAt: row.last_message_at,
  };
}

/** Le `sender_kind` DB redevient le `senderId` du domaine ('me' / id presta / 'system'). */
function toSenderId(row: MessageRow): string {
  if (row.sender_kind === 'client') return 'me';
  if (row.sender_kind === 'system') return 'system';
  return row.provider_id ?? '';
}

export function rowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: toSenderId(row),
    type: row.type,
    text: row.text,
    createdAt: row.created_at,
    quote: row.quote ?? undefined,
    document: row.document ?? undefined,
  };
}
