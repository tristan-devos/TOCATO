/**
 * Client Supabase de l'application (auth + DB + realtime).
 *
 * La session est persistée via AsyncStorage et rafraîchie automatiquement.
 * Les variables d'env (préfixe EXPO_PUBLIC_) sont inlinées par Metro au build ;
 * la clé anon est publique par design — la sécurité repose sur les politiques RLS.
 *
 * Tant que `.env` n'est pas rempli, `isSupabaseConfigured` vaut false : la
 * construction reste inoffensive (placeholder) et `initAuth` (auth-store.ts)
 * ne déclenche aucun appel réseau. L'app démarre donc normalement avant même
 * qu'un projet Supabase ne soit branché.
 */

import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

if (!isSupabaseConfigured && __DEV__) {
  console.warn(
    '[supabase] Configuration manquante : définir EXPO_PUBLIC_SUPABASE_URL et ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY dans .env (voir .env.example). ' +
      'Les fonctionnalités Supabase restent inactives en attendant.',
  );
}

export const supabase = createClient<Database>(
  isSupabaseConfigured ? supabaseUrl : 'http://localhost',
  isSupabaseConfigured ? supabaseAnonKey : 'anon-key-placeholder',
  {
    auth: {
      // AsyncStorage seulement sur natif : son implémentation web touche `window`,
      // ce qui casse le prerender statique d'`expo export`. Sur web, on laisse le
      // stockage par défaut de Supabase (localStorage, ou mémoire en SSR).
      ...(Platform.OS === 'web' ? {} : { storage: AsyncStorage }),
      autoRefreshToken: true,
      persistSession: true,
      // PKCE : flux OAuth sécurisé pour le natif. signInWithOAuth génère un
      // code_verifier (stocké ci-dessus), puis exchangeCodeForSession finalise
      // au retour du navigateur (voir auth-store.signInWithOAuth).
      flowType: 'pkce',
      // On gère nous-mêmes le retour OAuth (deep link), pas via l'URL de page.
      detectSessionInUrl: false,
    },
  },
);
