/**
 * Profil, adresses et rôle de l'utilisateur connecté (adossé à Supabase).
 *
 * Chargé à la connexion (depuis auth-store) et vidé à la déconnexion. Le rôle
 * vient de la RPC `current_provider_id` : un compte relié à une fiche prestataire
 * (par un admin) est prestataire, tout autre compte est client. Tant que le rôle
 * n'est pas connu (`role === null`), la navigation attend (use-auth-guard).
 */

import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import type { Address, Role } from '@/lib/types';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AddressRow {
  id: string;
  label: string;
  street: string;
  city: string;
  postal_code: string;
}

function toAddress(row: AddressRow): Address {
  return {
    id: row.id,
    label: row.label,
    street: row.street,
    city: row.city,
    postalCode: row.postal_code,
  };
}

interface ProfileState {
  profile: Profile | null;
  addresses: Address[];
  loading: boolean;
  /** null tant que le rôle n'est pas chargé. */
  role: Role | null;
  /** Fiche prestataire du compte (rôle 'provider'), sinon null. */
  providerId: string | null;
  loadProfile: () => Promise<void>;
  /** Insère une adresse ; renvoie son id, ou null en cas d'échec. */
  addAddress: (input: Omit<Address, 'id'>) => Promise<string | null>;
  removeAddress: (addressId: string) => Promise<void>;
  clear: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  addresses: [],
  loading: false,
  role: null,
  providerId: null,

  loadProfile: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      set({ profile: null, addresses: [], loading: false, role: null, providerId: null });
      return;
    }

    set({ loading: true });
    const [profileResult, addressResult, providerResult] = await Promise.all([
      supabase.from('profiles').select('id, name, email, phone').eq('id', userId).single(),
      supabase
        .from('addresses')
        .select('id, label, street, city, postal_code')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
      supabase.rpc('current_provider_id'),
    ]);

    const providerId = providerResult.data ?? null;
    set({
      profile: profileResult.data ?? null,
      addresses: (addressResult.data ?? []).map(toAddress),
      loading: false,
      role: providerId ? 'provider' : 'client',
      providerId,
    });
  },

  addAddress: async (input) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return null;

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: userId,
        label: input.label,
        street: input.street,
        city: input.city,
        postal_code: input.postalCode,
      })
      .select('id, label, street, city, postal_code')
      .single();

    if (error || !data) return null;
    const address = toAddress(data);
    set((s) => ({ addresses: [...s.addresses, address] }));
    return address.id;
  },

  removeAddress: async (addressId) => {
    const { error } = await supabase.from('addresses').delete().eq('id', addressId);
    if (error) return;
    set((s) => ({ addresses: s.addresses.filter((a) => a.id !== addressId) }));
  },

  clear: () =>
    set({ profile: null, addresses: [], loading: false, role: null, providerId: null }),
}));

// ——— Sélecteurs ———

export function useProfile(): Profile | null {
  return useProfileStore((s) => s.profile);
}

export function useAddresses(): Address[] {
  return useProfileStore((s) => s.addresses);
}

/** Rôle de l'utilisateur connecté ; null tant qu'il n'est pas chargé. */
export function useRole(): Role | null {
  return useProfileStore((s) => s.role);
}

export function useMyProviderId(): string | null {
  return useProfileStore((s) => s.providerId);
}
