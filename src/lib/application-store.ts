/**
 * Demande d'adhésion prestataire du compte connecté (docs/adhesion-prestataires.md).
 *
 * Chargée par profile-store avant de calculer le rôle (une demande en cours ou
 * refusée = rôle 'applicant'). L'envoi téléverse les pièces et la photo puis appelle la RPC
 * submit_provider_application, qui valide tout et vérifie la licence RBQ côté
 * serveur. Le Realtime sur sa ligne fait basculer le compte dès la décision.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { create } from 'zustand';

import type { ApplicationDraft } from '@/lib/application-draft';
import { digitsOnly, needsRbqLicence, parseHourlyRate } from '@/lib/application-draft';
import type { Database } from '@/lib/database.types';
import { uploadProviderDocument } from '@/lib/document-upload';
import { uploadProviderPhoto } from '@/lib/provider-photo';
import { supabase } from '@/lib/supabase';
import type { ProviderApplication } from '@/lib/types';

type ApplicationRow = Database['public']['Tables']['provider_applications']['Row'];

/** Ligne provider_applications -> domaine (partagé avec admin-store). */
export function rowToApplication(row: ApplicationRow): ProviderApplication {
  return {
    id: row.id,
    status: row.status,
    businessName: row.business_name,
    services: row.services,
    neq: row.neq,
    rbqLicence: row.rbq_licence,
    hourlyRate: row.hourly_rate,
    bio: row.bio,
    idDocumentPath: row.id_document_path,
    idDocumentPurgedAt: row.id_document_purged_at,
    insurancePath: row.insurance_path,
    photoPath: row.photo_path,
    rbqCheck: row.rbq_check
      ? {
          result: row.rbq_check.result,
          checkedAt: row.rbq_check.checked_at,
          registryName: row.rbq_check.registry_name ?? null,
          importedAt: row.rbq_check.imported_at ?? null,
        }
      : null,
    submittedAt: row.submitted_at,
    rejectionReason: row.rejection_reason,
  };
}

/** Code d'erreur renvoyé à l'écran (traduit via `apply.errors.<code>`). */
export type SubmitResult = { error: string | null };

interface ApplicationState {
  application: ProviderApplication | null;
  load: (userId: string) => Promise<void>;
  submit: (draft: ApplicationDraft) => Promise<SubmitResult>;
  /** Écoute sa demande (Realtime) ; `onChange` recharge la session (changement de rôle). */
  watch: (userId: string, onChange: () => void) => void;
  clear: () => void;
}

let channel: RealtimeChannel | null = null;

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  application: null,

  load: async (userId) => {
    const { data } = await supabase
      .from('provider_applications')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    set({ application: data ? rowToApplication(data) : null });
  },

  submit: async (draft) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    const hourlyRate = parseHourlyRate(draft.hourlyRate);
    if (!userId || hourlyRate === null) return { error: 'invalid_hourly_rate' };

    const idPath = draft.idDocument
      ? await uploadProviderDocument(userId, 'id', draft.idDocument)
      : draft.idDocumentPath;
    const insurancePath = draft.insurance
      ? await uploadProviderDocument(userId, 'insurance', draft.insurance)
      : draft.insurancePath;
    const photoPath = draft.photo
      ? await uploadProviderPhoto(userId, draft.photo)
      : draft.photoPath;
    if (!idPath || !insurancePath || !photoPath) return { error: 'upload_failed' };

    const { error } = await supabase.rpc('submit_provider_application', {
      p_business_name: draft.businessName.trim(),
      p_services: draft.services,
      p_neq: digitsOnly(draft.neq),
      p_rbq_licence: needsRbqLicence(draft.services) ? digitsOnly(draft.rbqLicence) : null,
      p_hourly_rate: hourlyRate,
      p_bio: draft.bio.trim(),
      p_id_document_path: idPath,
      p_insurance_path: insurancePath,
      p_photo_path: photoPath,
    });
    if (error) return { error: error.message };
    await get().load(userId);
    return { error: null };
  },

  watch: (userId, onChange) => {
    if (channel) return;
    channel = supabase
      .channel('tocato-application')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'provider_applications', filter: `user_id=eq.${userId}` },
        onChange,
      )
      .subscribe();
  },

  clear: () => {
    if (channel) {
      void supabase.removeChannel(channel);
      channel = null;
    }
    set({ application: null });
  },
}));

export function useApplication(): ProviderApplication | null {
  return useApplicationStore((s) => s.application);
}
