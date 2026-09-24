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

import type { ApplicationFunctions, ApplicationTables } from '@/lib/database-applications.types';
import type {
  Address,
  BookingAnswer,
  BookingStatus,
  Message,
  PriceRange,
  QuoteLine,
  QuoteStatus,
  ServiceId,
  SystemMessageKey,
  TimeSlotId,
} from '@/lib/types';

/** Émetteur d'un message côté DB (le `senderId` 'me' du domaine devient 'client'). */
export type MessageSenderKind = 'client' | 'provider' | 'system';

/** Colonne `messages.quote` (jsonb, snake_case) : voir supabase/quotes.sql. */
export type QuoteJson = {
  amount: number;
  details: string;
  status: QuoteStatus;
  lines?: QuoteLine[];
  proposed_date?: string;
  proposed_slot?: TimeSlotId;
  duration_hours?: number;
  warranty?: string;
};
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
          /** Compte relié (prestataire réel) ; null tant que la fiche n'est reliée à aucun compte. */
          user_id: string | null;
          /** Photo publiée (bucket provider-photos) ; null = initiales. */
          photo_path: string | null;
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
          /** Fin de l'intervention (complete_job) ; null avant son ajout. */
          completed_at: string | null;
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
          completed_at?: string | null;
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
          client_unread_count: number;
          provider_unread_count: number;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider_id: string;
          booking_id: string;
          client_unread_count?: number;
          provider_unread_count?: number;
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
          quote: QuoteJson | null;
          document: Document | null;
          system_key: SystemMessageKey | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_kind: MessageSenderKind;
          provider_id?: string | null;
          type: Message['type'];
          text: string;
          created_at?: string;
          quote?: QuoteJson | null;
          document?: Document | null;
          system_key?: SystemMessageKey | null;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [];
      };
    } & ApplicationTables;
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
      // Transitions d'état (supabase/transitions.sql) : lèvent une exception si
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
      // Côté prestataire (supabase/providers.sql) : consommées par l'interface
      // prestataire (lot 4).
      current_provider_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      list_open_requests: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          service_id: ServiceId;
          created_at: string;
          scheduled_date: string | null;
          time_slot: TimeSlotId | null;
          city: string | null;
          /** 3 premiers caractères du code postal (ex. H2J), jamais l'adresse. */
          postal_sector: string;
          answers: BookingAnswer[];
          description: string;
          photos: string[];
          estimate_min: number;
          estimate_max: number;
          my_conversation_id: string | null;
          my_quote_status: QuoteStatus | null;
        }[];
      };
      /** Devis complet (quotes.sql) : total calculé par le serveur ; renvoie la conversation. */
      send_quote: {
        Args: {
          p_booking_id: string;
          p_lines: QuoteLine[];
          p_proposed_date: string;
          p_proposed_slot: TimeSlotId;
          p_duration_hours: number;
          p_included: string;
          p_warranty: string;
        };
        Returns: string;
      };
      start_job: {
        Args: { p_booking_id: string };
        Returns: undefined;
      };
      complete_job: {
        Args: { p_booking_id: string };
        Returns: undefined;
      };
      provider_conversation_clients: {
        Args: Record<string, never>;
        Returns: { conversation_id: string; client_first_name: string }[];
      };
    } & ApplicationFunctions;
    Enums: Record<never, never>;
  };
}

/** Le `PriceRange` du domaine correspond aux colonnes estimate_min/max. */
export type DbEstimate = Pick<PriceRange, 'min' | 'max'>;
