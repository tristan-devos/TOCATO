/**
 * Types de la base pour l'adhésion des prestataires et leurs photos
 * (supabase/applications.sql, photos.sql, admin.sql).
 *
 * Séparés de `database.types.ts` (plafond de 300 lignes) et fusionnés dans son type
 * `Database`. Tables `admins` et `rbq_licences` absentes : l'app ne les lit jamais
 * (aucune policy), elle passe par `is_admin` et la vérification faite à l'envoi.
 * Alias `type` et non `interface` : supabase-js exige une signature d'index implicite,
 * qu'une interface n'a pas (sinon toute l'inférence du schéma tombe à `never`).
 */

import type {
  ApplicationStatus,
  PhotoChangeStatus,
  RbqCheckResult,
  ServiceId,
} from '@/lib/types';

/** Colonne `rbq_check` : résultat de rbq_check_licence au moment de l'envoi. */
export type RbqCheckJson = {
  result: RbqCheckResult;
  checked_at: string;
  registry_name?: string | null;
  registry_neq?: string | null;
  imported_at?: string | null;
};

type ProviderApplicationRow = {
  id: string;
  user_id: string;
  status: ApplicationStatus;
  business_name: string;
  services: ServiceId[];
  neq: string;
  rbq_licence: string | null;
  hourly_rate: number;
  bio: string;
  id_document_path: string | null;
  id_document_purged_at: string | null;
  insurance_path: string;
  photo_path: string | null;
  rbq_check: RbqCheckJson | null;
  submitted_at: string;
  decided_at: string | null;
  decided_by: string | null;
  rejection_reason: string | null;
  provider_id: string | null;
};

type ProviderPhotoChangeRow = {
  provider_id: string;
  user_id: string;
  status: PhotoChangeStatus;
  photo_path: string;
  submitted_at: string;
  decided_at: string | null;
  rejection_reason: string | null;
};

export type ApplicationTables = {
  provider_applications: {
    Row: ProviderApplicationRow;
    // Aucune écriture directe (RLS) : tout passe par les RPC ci-dessous. Objet vide
    // plutôt que `never`, que le type générique de supabase-js n'accepte pas.
    Insert: Record<string, never>;
    Update: Record<string, never>;
    Relationships: [];
  };
  provider_photo_changes: {
    Row: ProviderPhotoChangeRow;
    Insert: Record<string, never>;
    Update: Record<string, never>;
    Relationships: [];
  };
};

export type ApplicationFunctions = {
  is_admin: {
    Args: Record<string, never>;
    Returns: boolean;
  };
  /** Envoie (ou renvoie après refus) la demande du compte connecté ; renvoie son id. */
  submit_provider_application: {
    Args: {
      p_business_name: string;
      p_services: ServiceId[];
      p_neq: string;
      p_rbq_licence: string | null;
      p_hourly_rate: number;
      p_bio: string;
      p_id_document_path: string | null;
      p_insurance_path: string;
      p_photo_path: string;
    };
    Returns: string;
  };
  /** Prestataire relié : propose une nouvelle photo (validée par l'admin). */
  submit_provider_photo: {
    Args: { p_photo_path: string };
    Returns: undefined;
  };
  /** Admin : publie la photo proposée, ou la refuse avec un motif. */
  admin_approve_photo: {
    Args: { p_provider_id: string };
    Returns: undefined;
  };
  admin_reject_photo: {
    Args: { p_provider_id: string; p_reason: string };
    Returns: undefined;
  };
  /** Admin : crée la fiche prestataire vérifiée et la relie ; renvoie son id. */
  admin_approve_application: {
    Args: { p_application_id: string };
    Returns: string;
  };
  admin_reject_application: {
    Args: { p_application_id: string; p_reason: string };
    Returns: undefined;
  };
  /** Admin : nom et courriel de chaque demandeur (profiles est owner-only). */
  admin_list_applicants: {
    Args: Record<string, never>;
    Returns: { applicant_id: string; applicant_name: string; applicant_email: string }[];
  };
  /** Admin : date du dernier import du registre RBQ et nombre de licences. */
  admin_rbq_registry_status: {
    Args: Record<string, never>;
    Returns: { last_import: string | null; licence_count: number }[];
  };
};
