/**
 * Profil + adresses de l'utilisateur connecté (adossé à Supabase).
 *
 * Chargé à la connexion (depuis auth-store) et vidé à la déconnexion. Remplace
 * l'ancien `user` mock du store applicatif. Les bookings/conversations/messages
 * restent dans `store.ts` en attendant leur propre migration.
 */

import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import type { Address } from '@/lib/types';

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

  loadProfile: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      set({ profile: null, addresses: [], loading: false });
      return;
    }

    set({ loading: true });
    const [profileResult, addressResult] = await Promise.all([
      supabase.from('profiles').select('id, name, email, phone').eq('id', userId).single(),
      supabase
        .from('addresses')
        .select('id, label, street, city, postal_code')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
    ]);

    set({
      profile: profileResult.data ?? null,
      addresses: (addressResult.data ?? []).map(toAddress),
      loading: false,
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

  clear: () => set({ profile: null, addresses: [], loading: false }),
}));

// ——— Sélecteurs ———

export function useProfile(): Profile | null {
  return useProfileStore((s) => s.profile);
}

export function useAddresses(): Address[] {
  return useProfileStore((s) => s.addresses);
}
