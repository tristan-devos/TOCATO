import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { type AuthStatus, useAuthStatus } from '@/lib/auth-store';
import { useIsAdmin, useRole } from '@/lib/profile-store';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { Role } from '@/lib/types';

// Premier segment des routes réservées à chaque rôle (les autres, chat et
// profil public d'un prestataire, sont partagées).
const CLIENT_ONLY = new Set(['(tabs)', 'booking', 'reservation', 'profile']);
const PROVIDER_ONLY = new Set(['(provider)', 'request', 'job']);
const APPLICANT_ONLY = new Set(['apply']);
// Écran « Adhésions » : réservé aux comptes de la table admins (is_admin).
const ADMIN_ONLY = new Set(['admin']);

type Target = '/login' | '/' | '/apply' | '/requests';

/**
 * Où envoyer l'utilisateur : 'wait' tant que la session ou le rôle charge,
 * null s'il est déjà sur une route permise, sinon la route cible.
 */
function redirectFor(
  status: AuthStatus,
  role: Role | null,
  isAdmin: boolean,
  first: string,
): Target | null | 'wait' {
  if (!isSupabaseConfigured) return null;
  if (status === 'loading') return 'wait';

  const inAuthGroup = first === '(auth)';
  if (status === 'anonymous') return inAuthGroup ? null : '/login';
  if (role === null) return 'wait';

  if (ADMIN_ONLY.has(first) && !isAdmin) return '/';
  if (role === 'applicant') return APPLICANT_ONLY.has(first) ? null : '/apply';
  if (
    role === 'provider' &&
    (inAuthGroup || first === '' || CLIENT_ONLY.has(first) || APPLICANT_ONLY.has(first))
  ) {
    return '/requests';
  }
  if (role === 'client' && (inAuthGroup || PROVIDER_ONLY.has(first) || APPLICANT_ONLY.has(first))) {
    return '/';
  }
  return null;
}

/**
 * Redirige selon l'état de session et le rôle :
 *  - non connecté hors du groupe (auth) -> écran de connexion ;
 *  - connecté : attend que le rôle soit chargé, puis envoie un prestataire vers
 *    ses onglets (demandes) et un client vers l'app client, en les sortant des
 *    routes réservées à l'autre rôle (et du groupe (auth)) ; un demandeur
 *    d'adhésion reste cantonné au formulaire / statut de sa demande (/apply).
 *
 * Renvoie true quand l'utilisateur est sur une route permise (rien à attendre ni
 * à rediriger) : le layout racine garde l'écran de démarrage jusque-là, sinon
 * l'accueil client (route par défaut) apparaît un instant avant la redirection.
 *
 * Inactif tant que Supabase n'est pas configuré (l'app reste accessible en démo),
 * et tant que `navigatorMounted` est faux : le layout racine ne rend pas encore
 * le Stack (police en chargement), et naviguer avant son montage lève une erreur.
 */
export function useAuthGuard(navigatorMounted: boolean): boolean {
  const status = useAuthStatus();
  const role = useRole();
  const isAdmin = useIsAdmin();
  const segments = useSegments();
  const router = useRouter();

  const first: string = segments[0] ?? '';
  const target = redirectFor(status, role, isAdmin, first);

  useEffect(() => {
    if (navigatorMounted && target !== null && target !== 'wait') router.replace(target);
  }, [navigatorMounted, target, router]);

  return navigatorMounted && target === null;
}
