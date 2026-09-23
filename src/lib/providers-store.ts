/**
 * Catalogue des fiches prestataires, lu depuis la table `providers` (Supabase).
 *
 * Chargé à la connexion
 * (depuis auth-store), lecture réservée aux utilisateurs connectés (RLS).
 */

import { create } from 'zustand';

import { rowToProvider } from '@/lib/db-mappers';
import { supabase } from '@/lib/supabase';
import type { Provider } from '@/lib/types';

interface ProvidersState {
  providers: Provider[];
  loadProviders: () => Promise<void>;
  clear: () => void;
}

export const useProvidersStore = create<ProvidersState>((set) => ({
  providers: [],

  loadProviders: async () => {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('rating', { ascending: false });
    if (error && __DEV__) console.warn('[providers]', error.message);
    set({ providers: (data ?? []).map(rowToProvider) });
  },

  clear: () => set({ providers: [] }),
}));

// --- Sélecteurs (renvoient des objets existants, jamais un tableau neuf) ---

export function useProvider(providerId: string | undefined): Provider | undefined {
  return useProvidersStore((s) =>
    providerId ? s.providers.find((p) => p.id === providerId) : undefined,
  );
}

/** Tableau brut : filtrer/trier en useMemo dans le composant (règle Zustand v5). */
export function useProviders(): Provider[] {
  return useProvidersStore((s) => s.providers);
}
