/**
 * État d'authentification (Supabase Auth, email + mot de passe).
 *
 * Store Zustand volontairement séparé du store applicatif (`store.ts`) : pas de
 * persistance manuelle ici, Supabase gère la session via AsyncStorage. La couche
 * est prête à être câblée à une UI de connexion dans une PR ultérieure.
 */

import type { AuthError, Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { create } from 'zustand';

import { useProfileStore } from '@/lib/profile-store';
import { useAppStore } from '@/lib/store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

/** Fournisseurs OAuth câblés (login via navigateur, compatible Expo Go). */
export type OAuthProvider = 'google';

export interface AuthResult {
  error: string | null;
}

export interface SignUpResult extends AuthResult {
  /** Vrai quand l'inscription exige une confirmation par courriel (pas de session). */
  needsConfirmation: boolean;
}

interface AuthState {
  session: Session | null;
  status: AuthStatus;
  signUp: (email: string, password: string, name: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
}

/** Traduit les erreurs Supabase courantes en messages FR pour l'UI. */
function toFrenchError(error: AuthError | null): string | null {
  if (!error) return null;
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Courriel ou mot de passe incorrect.';
    case 'User already registered':
      return 'Un compte existe déjà avec ce courriel.';
    case 'Email not confirmed':
      return 'Veuillez confirmer votre courriel avant de vous connecter.';
    default:
      return error.message;
  }
}

export const useAuthStore = create<AuthState>(() => ({
  session: null,
  status: 'loading',

  signUp: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return {
      error: toFrenchError(error),
      needsConfirmation: !error && data.session === null,
    };
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: toFrenchError(error) };
  },

  // Flux OAuth via navigateur (compatible Expo Go) : on récupère l'URL d'auth
  // de Supabase, on l'ouvre dans une session navigateur, puis on échange le
  // code renvoyé sur le deep link contre une session. La session établie
  // déclenche onAuthStateChange -> apply() (chargement profil + données).
  signInWithOAuth: async (provider) => {
    const redirectTo = Linking.createURL('auth-callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) return { error: toFrenchError(error) };
    if (!data.url) return { error: 'Connexion impossible : URL OAuth manquante.' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    // L'utilisateur a fermé le navigateur sans terminer : pas une erreur.
    if (result.type !== 'success') return { error: null };

    const code = Linking.parse(result.url).queryParams?.code;
    if (typeof code !== 'string') {
      return { error: "Connexion interrompue : code d'autorisation introuvable." };
    }
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    return { error: toFrenchError(exchangeError) };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error: toFrenchError(error) };
  },
}));

let initialized = false;

/**
 * Démarre l'écoute de session (à appeler une fois au montage racine).
 * Idempotent : les appels suivants sont ignorés.
 */
export function initAuth(): void {
  if (initialized) return;
  initialized = true;

  // Pas de projet branché : on reste 'anonymous' sans appel réseau.
  if (!isSupabaseConfigured) {
    useAuthStore.setState({ status: 'anonymous' });
    return;
  }

  const apply = (session: Session | null) => {
    useAuthStore.setState({
      session,
      status: session ? 'authenticated' : 'anonymous',
    });
    if (session) {
      void useProfileStore.getState().loadProfile();
      void useAppStore.getState().loadAll();
    } else {
      useProfileStore.getState().clear();
      useAppStore.getState().clearAll();
    }
  };

  void supabase.auth.getSession().then(({ data }) => apply(data.session));
  supabase.auth.onAuthStateChange((_event, session) => apply(session));
}

// ——— Sélecteurs ———

export function useSession(): Session | null {
  return useAuthStore((s) => s.session);
}

export function useAuthStatus(): AuthStatus {
  return useAuthStore((s) => s.status);
}
