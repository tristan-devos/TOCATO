/**
 * Types de la base Supabase (schéma `public`).
 *
 * Écrit à la main et tenu aligné sur `supabase/schema.sql`. Les unions et les
 * formes JSON sont réutilisées depuis `@/lib/types` (source de vérité du domaine)
 * plutôt que redéclarées.
 *
 * Régénérable plus tard une fois le projet lié :
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 * (à ce moment, réimporter les unions du domaine pour rester DRY).
 */

import type {
  Address,
  BookingAnswer,
  BookingStatus,
  Message,
  PriceRange,
  ServiceId,
  TimeSlotId,
} from '@/lib/types';

/** Émetteur d'un message côté DB (le `senderId` 'me' du domaine devient 'client'). */
export type MessageSenderKind = 'client' | 'provider' | 'system';

type Quote = NonNullable<Message['quote']>;
type Document = NonNullable<Message['document']>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          street: string;
          city: string;
          postal_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          street: string;
          city: string;
          postal_code: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['addresses']['Insert']>;
        Relationships: [];
      };
      providers: {
        Row: {
          id: string;
          name: string;
          services: ServiceId[];
          rating: number;
          review_count: number;
          jobs_completed: number;
          verified: boolean;
          response_time: string;
          hourly_rate: number;
          bio: string;
          member_since: string;
        };
        Insert: Database['public']['Tables']['providers']['Row'];
        Update: Partial<Database['public']['Tables']['providers']['Row']>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          service_id: ServiceId;
          status: BookingStatus;
          created_at: string;
          scheduled_date: string | null;
          time_slot: TimeSlotId | null;
          address: Address;
          answers: BookingAnswer[];
          description: string;
          photos: string[];
          estimate_min: number;
          estimate_max: number;
          agreed_price: number | null;
          provider_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_id: ServiceId;
          status?: BookingStatus;
          created_at?: string;
          scheduled_date?: string | null;
          time_slot?: TimeSlotId | null;
          address: Address;
          answers: BookingAnswer[];
          description: string;
          photos?: string[];
          estimate_min: number;
          estimate_max: number;
          agreed_price?: number | null;
          provider_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          provider_id: string;
          booking_id: string;
          unread_count: number;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider_id: string;
          booking_id: string;
          unread_count?: number;
          last_message_at?: string;
        };
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_kind: MessageSenderKind;
          provider_id: string | null;
          type: Message['type'];
          text: string;
          created_at: string;
          quote: Quote | null;
          document: Document | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_kind: MessageSenderKind;
          provider_id?: string | null;
          type: Message['type'];
          text: string;
          created_at?: string;
          quote?: Quote | null;
          document?: Document | null;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      // Crée une demande ouverte (sans prestataire) ; renvoie son id.
      create_booking: {
        Args: {
          p_service_id: ServiceId;
          p_scheduled_date: string | null;
          p_time_slot: TimeSlotId | null;
          p_address: Address;
          p_answers: BookingAnswer[];
          p_description: string;
          p_estimate_min: number;
          p_estimate_max: number;
        };
        Returns: string;
      };
      seed_demo: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      // Transitions d'état (supabase/transitions.sql) — lèvent une exception si
      // l'appelant n'a pas le droit ou si la transition n'est pas permise.
      accept_quote: {
        Args: { p_message_id: string };
        Returns: undefined;
      };
      decline_quote: {
        Args: { p_message_id: string };
        Returns: undefined;
      };
      cancel_booking: {
        Args: { p_booking_id: string };
        Returns: undefined;
      };
      set_booking_photos: {
        Args: { p_booking_id: string; p_photos: string[] };
        Returns: undefined;
      };
      mark_conversation_read: {
        Args: { p_conversation_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<never, never>;
  };
}

/** Le `PriceRange` du domaine correspond aux colonnes estimate_min/max. */
export type DbEstimate = Pick<PriceRange, 'min' | 'max'>;
