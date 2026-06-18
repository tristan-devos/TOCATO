export type ServiceId = 'plumber' | 'mover' | 'gardener';

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
}

export interface Provider {
  id: string;
  name: string;
  services: ServiceId[];
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  verified: boolean;
  responseTime: string;
  /** Indicative hourly rate in CAD */
  hourlyRate: number;
  bio: string;
  memberSince: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type TimeSlotId = 'morning' | 'afternoon' | 'evening';

/** Answer to a booking wizard question, denormalized for display. */
export interface BookingAnswer {
  questionId: string;
  questionLabel: string;
  /** Display labels of selected options */
  values: string[];
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface Booking {
  id: string;
  serviceId: ServiceId;
  status: BookingStatus;
  createdAt: string; // ISO
  /** Requested date (ISO date-only) — absent when "as soon as possible" */
  scheduledDate?: string;
  timeSlot?: TimeSlotId;
  address: Address;
  answers: BookingAnswer[];
  description: string;
  /** Storage paths of attached photos (bucket booking-photos) — viewed via signed URLs */
  photos: string[];
  estimate: PriceRange;
  /** Final price when a quote has been accepted */
  agreedPrice?: number;
  providerId: string;
  conversationId: string;
}

export type MessageType = 'text' | 'quote' | 'document' | 'system';

export type QuoteStatus = 'pending' | 'accepted' | 'declined';

export interface Message {
  id: string;
  conversationId: string;
  /** 'me' for the client, otherwise the provider id */
  senderId: string;
  type: MessageType;
  text: string;
  createdAt: string; // ISO
  quote?: {
    amount: number;
    details: string;
    status: QuoteStatus;
  };
  document?: {
    name: string;
    size: string;
  };
}

export interface Conversation {
  id: string;
  providerId: string;
  bookingId: string;
  unreadCount: number;
  lastMessageAt: string; // ISO
}

export interface User {
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
}
