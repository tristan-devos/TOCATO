/**
 * Types du domaine TOCATO (côté client).
 *
 * Tout l'état de l'app est typé ici. Quand un vrai backend remplacera les
 * données mock, ces types deviendront les contrats de l'API.
 */

export type ServiceId = 'plombier' | 'demenageur' | 'jardinier';

export interface Address {
  id: string;
  /** Ex. « Maison », « Bureau » */
  label: string;
  street: string;
  city: string;
  postalCode: string;
}

export interface Provider {
  id: string;
  name: string;
  services: ServiceId[];
  /** Note moyenne sur 5 */
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  verified: boolean;
  /** Ex. « Répond en ~15 min » */
  responseTime: string;
  /** Taux horaire indicatif en CAD */
  hourlyRate: number;
  bio: string;
  memberSince: string;
}

export type BookingStatus =
  | 'pending' // demande envoyée, en attente du prestataire
  | 'confirmed' // prestataire confirmé, date fixée
  | 'in_progress' // intervention en cours
  | 'completed'
  | 'cancelled';

export type TimeSlotId = 'morning' | 'afternoon' | 'evening';

/** Réponse à une question du flux de réservation, dénormalisée pour l'affichage. */
export interface BookingAnswer {
  questionId: string;
  questionLabel: string;
  /** Libellés des options choisies */
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
  /** Date souhaitée (ISO, date seule) — absente si « dès que possible » */
  scheduledDate?: string;
  timeSlot?: TimeSlotId;
  address: Address;
  answers: BookingAnswer[];
  description: string;
  photoCount: number;
  estimate: PriceRange;
  /** Prix final si un devis a été accepté */
  agreedPrice?: number;
  providerId: string;
  conversationId: string;
}

export type MessageType = 'text' | 'quote' | 'document' | 'system';

export type QuoteStatus = 'pending' | 'accepted' | 'declined';

export interface Message {
  id: string;
  conversationId: string;
  /** 'me' pour le client, sinon l'id du prestataire */
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
