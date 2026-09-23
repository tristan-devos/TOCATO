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
import { useProviderStore } from '@/lib/provider-store';
import { useProvidersStore } from '@/lib/providers-store';
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

// Un code OAuth ne s'échange qu'une fois (le second échange échoue). Ce garde
// évite un double échange quand le retour arrive à la fois par le navigateur et
// par le deep link selon la plateforme.
const handledOAuthCodes = new Set<string>();

/**
 * Finalise une connexion OAuth à partir de l'URL de retour : extrait le code et
 * l'échange contre une session (ce qui déclenche onAuthStateChange -> apply()).
 * Idempotent par code. Renvoie un message d'erreur, ou null (succès, ou URL sans
 * code OAuth — un deep link ordinaire est alors simplement ignoré).
 */
async function completeOAuthSession(url: string): Promise<string | null> {
  const code = Linking.parse(url).queryParams?.code;
  if (typeof code !== 'string' || handledOAuthCodes.has(code)) return null;
  handledOAuthCodes.add(code);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return toFrenchError(error);
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
    // Deux retours possibles selon la plateforme : soit le navigateur rend la
    // main ici avec l'URL (on finalise tout de suite), soit la redirection ouvre
    // l'app comme deep link (le listener d'initAuth prend alors le relais). Si
    // l'utilisateur a juste fermé le navigateur, ce n'est pas une erreur.
    if (result.type !== 'success') return { error: null };
    return { error: await completeOAuthSession(result.url) };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error: toFrenchError(error) };
  },
}));

let initialized = false;

/**
 * Charge les données de la session. Le profil (donc le rôle) d'abord : le store
 * applicatif en dépend pour savoir qui est « moi » dans les conversations.
 */
async function loadSessionData(): Promise<void> {
  await useProfileStore.getState().loadProfile();
  const tasks: Promise<void>[] = [
    useAppStore.getState().loadAll(),
    useProvidersStore.getState().loadProviders(),
  ];
  if (useProfileStore.getState().role === 'provider') {
    tasks.push(useProviderStore.getState().loadProviderData());
  }
  await Promise.all(tasks);
}

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
      void loadSessionData();
    } else {
      useProfileStore.getState().clear();
      useAppStore.getState().clearAll();
      useProvidersStore.getState().clear();
      useProviderStore.getState().clear();
    }
  };

  void supabase.auth.getSession().then(({ data }) => apply(data.session));
  supabase.auth.onAuthStateChange((_event, session) => apply(session));

  // Retour OAuth ouvert comme deep link (cas où le navigateur ne rend pas la
  // main à signInWithOAuth, fréquent en Expo Go) : on finalise la session ici.
  Linking.addEventListener('url', ({ url }) => {
    void completeOAuthSession(url);
  });
  void Linking.getInitialURL().then((url) => {
    if (url) void completeOAuthSession(url);
  });
}

// ——— Sélecteurs ———

export function useSession(): Session | null {
  return useAuthStore((s) => s.session);
}

export function useAuthStatus(): AuthStatus {
  return useAuthStore((s) => s.status);
}
