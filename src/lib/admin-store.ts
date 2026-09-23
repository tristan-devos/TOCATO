/**
 * Écran « Adhésions » de l'admin (docs/adhesion-prestataires.md, lot 4).
 *
 * Lit toutes les demandes (la RLS les ouvre à is_admin()), le nom et le courriel des
 * demandeurs (RPC admin_list_applicants) et la fraîcheur du registre RBQ. Les
 * décisions passent par les RPC admin_approve_application / admin_reject_application,
 * qui revérifient is_admin() côté serveur. Rechargé à chaque ouverture de l'écran.
 */

import { create } from 'zustand';

import { rowToApplication } from '@/lib/application-store';
import { supabase } from '@/lib/supabase';
import type { AdminApplication, RbqRegistryStatus } from '@/lib/types';

/** Code d'erreur du serveur, traduit par l'écran (`admin.errors.<code>`). */
export type DecisionResult = { error: string | null };

interface AdminState {
  applications: AdminApplication[];
  registry: RbqRegistryStatus | null;
  load: () => Promise<void>;
  approve: (applicationId: string) => Promise<DecisionResult>;
  reject: (applicationId: string, reason: string) => Promise<DecisionResult>;
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

  load: async () => {
    const [applicationsResult, applicantsResult, registryResult] = await Promise.all([
      supabase.from('provider_applications').select('*'),
      supabase.rpc('admin_list_applicants'),
      supabase.rpc('admin_rbq_registry_status'),
    ]);
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

  clear: () => set({ applications: [], registry: null }),
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
