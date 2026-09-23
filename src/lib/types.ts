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
  /** Requested date (ISO date-only): absent when "as soon as possible" */
  scheduledDate?: string;
  timeSlot?: TimeSlotId;
  address: Address;
  answers: BookingAnswer[];
  description: string;
  /** Storage paths of attached photos (bucket booking-photos): viewed via signed URLs */
  photos: string[];
  estimate: PriceRange;
  /** Final price when a quote has been accepted */
  agreedPrice?: number;
  /**
   * Provider confirmed for the job: set when the client accepts a quote.
   * While the request is open, interested providers each open a conversation
   * (see Conversation.bookingId); there is no assigned provider yet.
   */
  providerId?: string;
}

export type MessageType = 'text' | 'quote' | 'document' | 'system';

export type QuoteStatus = 'pending' | 'accepted' | 'declined';

/**
 * Automatic (system) messages, written by server-side RPCs. The app renders them
 * in the active language AND from the reader's side (client or provider).
 */
export type SystemMessageKey =
  | 'quoteAccepted'
  | 'otherProviderChosen'
  | 'quoteDeclined'
  | 'bookingCancelled'
  | 'jobStarted'
  | 'jobCompleted';

export interface Message {
  id: string;
  conversationId: string;
  /** 'me' for the viewer's own messages, 'system', otherwise the other party ('client' or a provider id) */
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
  /** System messages only; absent on old rows (fall back to `text`). */
  systemKey?: SystemMessageKey;
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

/**
 * Who is using the app: a client, a provider linked to a `providers` row, or an
 * applicant (wants to become a provider: application pending, rejected, or not yet sent).
 */
export type Role = 'client' | 'provider' | 'applicant';

/** Status of a provider membership application (docs/adhesion-prestataires.md). */
export type ApplicationStatus = 'submitted' | 'approved' | 'rejected';

/** Outcome of the RBQ licence check (plumbing, subclass 15.5). Indicative: the admin decides. */
export type RbqCheckResult =
  | 'ok'
  | 'not_found'
  | 'missing_subcategory'
  | 'restricted'
  | 'neq_mismatch'
  | 'registry_unavailable';

/** RBQ check stored with an application (column rbq_check). */
export interface RbqCheck {
  result: RbqCheckResult;
  checkedAt: string;
  registryName: string | null;
  importedAt: string | null;
}

/** A provider membership application, as its author (or the admin) sees it. */
export interface ProviderApplication {
  id: string;
  status: ApplicationStatus;
  businessName: string;
  services: ServiceId[];
  /** Quebec enterprise number, 10 digits. */
  neq: string;
  /** RBQ licence, 10 digits; null outside plumbing. */
  rbqLicence: string | null;
  hourlyRate: number;
  bio: string;
  idDocumentPath: string;
  insurancePath: string;
  rbqCheck: RbqCheck | null;
  submittedAt: string;
  rejectionReason: string | null;
}

/**
 * An open request as a provider sees it (RPC list_open_requests): never the exact
 * address nor the client's name: only the city and postal sector (e.g. H2J).
 */
export interface OpenRequest {
  id: string;
  serviceId: ServiceId;
  createdAt: string; // ISO
  scheduledDate?: string;
  timeSlot?: TimeSlotId;
  city: string;
  /** First 3 characters of the postal code (e.g. H2J). */
  postalSector: string;
  answers: BookingAnswer[];
  description: string;
  photos: string[];
  estimate: PriceRange;
  /** The provider's own conversation on this request, once they quoted. */
  myConversationId?: string;
  myQuoteStatus?: QuoteStatus;
}
