/**
 * Écran « Adhésions » de l'admin (docs/adhesion-prestataires.md, lot 4).
 *
 * Lit toutes les demandes (la RLS les ouvre à is_admin()), le nom et le courriel des
 * demandeurs (RPC admin_list_applicants) et la fraîcheur du registre RBQ. Les
 * décisions passent par les RPC admin_approve_application / admin_reject_application,
 * qui revérifient is_admin() côté serveur. Rechargé à chaque ouverture de l'écran.
 * Même chose pour les photos proposées par les prestataires déjà approuvés
 * (provider_photo_changes, admin_approve_photo / admin_reject_photo).
 */

import { create } from 'zustand';

import { rowToApplication } from '@/lib/application-store';
import { rowToPhotoChange } from '@/lib/provider-photo';
import { useProvidersStore } from '@/lib/providers-store';
import { supabase } from '@/lib/supabase';
import type { AdminApplication, AdminPhotoChange, RbqRegistryStatus } from '@/lib/types';

/** Code d'erreur du serveur, traduit par l'écran (`admin.errors.<code>`). */
export type DecisionResult = { error: string | null };

interface AdminState {
  applications: AdminApplication[];
  registry: RbqRegistryStatus | null;
  /** Photos proposées en attente de validation, les plus anciennes d'abord. */
  photoChanges: AdminPhotoChange[];
  load: () => Promise<void>;
  approve: (applicationId: string) => Promise<DecisionResult>;
  reject: (applicationId: string, reason: string) => Promise<DecisionResult>;
  approvePhoto: (providerId: string) => Promise<DecisionResult>;
  rejectPhoto: (providerId: string, reason: string) => Promise<DecisionResult>;
  clear: () => void;
}

/** En attente d'abord, puis les plus récentes. */
function byPriority(a: AdminApplication, b: AdminApplication): number {
  const pending = Number(b.status === 'submitted') - Number(a.status === 'submitted');
  return pending !== 0 ? pending : b.submittedAt.localeCompare(a.submittedAt);
}

export const useAdminStore = create<AdminState>((set, get) => ({
  applications: [],
  registry: null,
  photoChanges: [],

  load: async () => {
    const [applicationsResult, applicantsResult, registryResult, photosResult] = await Promise.all([
      supabase.from('provider_applications').select('*'),
      supabase.rpc('admin_list_applicants'),
      supabase.rpc('admin_rbq_registry_status'),
      supabase
        .from('provider_photo_changes')
        .select('*')
        .eq('status', 'submitted')
        .order('submitted_at'),
    ]);
    // Nom et photo actuelle : fiches lisibles par tout compte connecté.
    const photoRows = photosResult.data ?? [];
    const { data: providerRows } = photoRows.length
      ? await supabase
          .from('providers')
          .select('id, name, photo_path')
          .in('id', photoRows.map((row) => row.provider_id))
      : { data: [] };
    const providersById = new Map((providerRows ?? []).map((p) => [p.id, p] as const));
    const photoChanges = photoRows.map((row): AdminPhotoChange => {
      const provider = providersById.get(row.provider_id);
      return {
        ...rowToPhotoChange(row),
        providerName: provider?.name ?? '',
        currentPhotoPath: provider?.photo_path ?? null,
      };
    });
    const contacts = new Map(
      (applicantsResult.data ?? []).map((c) => [c.applicant_id, c] as const),
    );
    const applications = (applicationsResult.data ?? [])
      .map((row): AdminApplication => {
        const contact = contacts.get(row.user_id);
        return {
          ...rowToApplication(row),
          applicantName: contact?.applicant_name ?? '',
          applicantEmail: contact?.applicant_email ?? '',
        };
      })
      .sort(byPriority);
    const registry = registryResult.data?.[0];
    set({
      applications,
      photoChanges,
      registry: registry
        ? { lastImport: registry.last_import, licenceCount: registry.licence_count }
        : null,
    });
  },

  approve: async (applicationId) => {
    const { error } = await supabase.rpc('admin_approve_application', {
      p_application_id: applicationId,
    });
    if (error) return { error: error.message };
    await get().load();
    return { error: null };
  },

  reject: async (applicationId, reason) => {
    const { error } = await supabase.rpc('admin_reject_application', {
      p_application_id: applicationId,
      p_reason: reason.trim(),
    });
    if (error) return { error: error.message };
    await get().load();
    return { error: null };
  },

  approvePhoto: async (providerId) => {
    const { error } = await supabase.rpc('admin_approve_photo', { p_provider_id: providerId });
    if (error) return { error: error.message };
    // La nouvelle photo s'affiche partout (fiches relues).
    await Promise.all([get().load(), useProvidersStore.getState().loadProviders()]);
    return { error: null };
  },

  rejectPhoto: async (providerId, reason) => {
    const { error } = await supabase.rpc('admin_reject_photo', {
      p_provider_id: providerId,
      p_reason: reason.trim(),
    });
    if (error) return { error: error.message };
    await get().load();
    return { error: null };
  },

  clear: () => set({ applications: [], registry: null, photoChanges: [] }),
}));

export function useAdminApplications(): AdminApplication[] {
  return useAdminStore((s) => s.applications);
}

export function useAdminApplication(id: string | undefined): AdminApplication | undefined {
  return useAdminStore((s) => s.applications.find((a) => a.id === id));
}

export function useRegistryStatus(): RbqRegistryStatus | null {
  return useAdminStore((s) => s.registry);
}

/** Tableau brut : ne pas filtrer dans le sélecteur (règle Zustand v5). */
export function useAdminPhotoChanges(): AdminPhotoChange[] {
  return useAdminStore((s) => s.photoChanges);
}

export function useAdminPhotoChange(providerId: string | undefined): AdminPhotoChange | undefined {
  return useAdminStore((s) => s.photoChanges.find((c) => c.providerId === providerId));
}
