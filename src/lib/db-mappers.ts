/**
 * Conversion lignes Supabase -> types du domaine (`@/lib/types`).
 * Les écrans ne manipulent que les types du domaine ; ces fonctions sont la
 * frontière unique entre le schéma DB et l'application.
 *
 * Les conversations et messages dépendent du rôle de l'utilisateur : « moi »
 * (senderId 'me') et le compteur de non-lus ne sont pas les mêmes côté client
 * et côté prestataire.
 */

import type { Database } from '@/lib/database.types';
import type {
  Booking,
  Conversation,
  Message,
  OpenRequest,
  Provider,
  Role,
} from '@/lib/types';

type Tables = Database['public']['Tables'];
type BookingRow = Tables['bookings']['Row'];
type ConversationRow = Tables['conversations']['Row'];
type MessageRow = Tables['messages']['Row'];
type ProviderRow = Tables['providers']['Row'];
type OpenRequestRow = Database['public']['Functions']['list_open_requests']['Returns'][number];

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
    photos: row.photos,
    estimate: { min: row.estimate_min, max: row.estimate_max },
    agreedPrice: row.agreed_price ?? undefined,
    providerId: row.provider_id ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
}

export function rowToConversation(row: ConversationRow, role: Role): Conversation {
  return {
    id: row.id,
    providerId: row.provider_id,
    bookingId: row.booking_id,
    unreadCount: role === 'provider' ? row.provider_unread_count : row.client_unread_count,
    lastMessageAt: row.last_message_at,
  };
}

/** Le `sender_kind` DB devient le `senderId` du domaine, vu depuis le rôle courant. */
function toSenderId(row: MessageRow, role: Role): string {
  if (row.sender_kind === 'system') return 'system';
  if (row.sender_kind === 'client') return role === 'client' ? 'me' : 'client';
  return role === 'provider' ? 'me' : (row.provider_id ?? '');
}

export function rowToMessage(row: MessageRow, role: Role): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: toSenderId(row, role),
    type: row.type,
    text: row.text,
    createdAt: row.created_at,
    quote: row.quote ?? undefined,
    document: row.document ?? undefined,
    systemKey: row.system_key ?? undefined,
  };
}

export function rowToProvider(row: ProviderRow): Provider {
  return {
    id: row.id,
    name: row.name,
    services: row.services,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    jobsCompleted: row.jobs_completed,
    verified: row.verified,
    responseTime: row.response_time,
    hourlyRate: Number(row.hourly_rate),
    bio: row.bio,
    memberSince: row.member_since,
    photoPath: row.photo_path,
  };
}

export function rowToOpenRequest(row: OpenRequestRow): OpenRequest {
  return {
    id: row.id,
    serviceId: row.service_id,
    createdAt: row.created_at,
    scheduledDate: row.scheduled_date ?? undefined,
    timeSlot: row.time_slot ?? undefined,
    city: row.city ?? '',
    postalSector: row.postal_sector,
    answers: row.answers,
    description: row.description,
    photos: row.photos,
    estimate: { min: Number(row.estimate_min), max: Number(row.estimate_max) },
    myConversationId: row.my_conversation_id ?? undefined,
    myQuoteStatus: row.my_quote_status ?? undefined,
  };
}
