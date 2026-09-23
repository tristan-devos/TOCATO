/**
 * Types de la base pour l'adhésion des prestataires (supabase/applications.sql).
 *
 * Séparés de `database.types.ts` (plafond de 300 lignes) et fusionnés dans son type
 * `Database`. Tables `admins` et `rbq_licences` absentes : l'app ne les lit jamais
 * (aucune policy), elle passe par `is_admin` et la vérification faite à l'envoi.
 * Alias `type` et non `interface` : supabase-js exige une signature d'index implicite,
 * qu'une interface n'a pas (sinon toute l'inférence du schéma tombe à `never`).
 */

import type { ApplicationStatus, RbqCheckResult, ServiceId } from '@/lib/types';

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
  id_document_path: string;
  insurance_path: string;
  rbq_check: RbqCheckJson | null;
  submitted_at: string;
  decided_at: string | null;
  decided_by: string | null;
  rejection_reason: string | null;
  provider_id: string | null;
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
      p_id_document_path: string;
      p_insurance_path: string;
    };
    Returns: string;
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
};
