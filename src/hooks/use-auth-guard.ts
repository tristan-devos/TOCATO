import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStatus } from '@/lib/auth-store';
import { useIsAdmin, useRole } from '@/lib/profile-store';
import { isSupabaseConfigured } from '@/lib/supabase';

// Premier segment des routes réservées à chaque rôle (les autres, chat et
// profil public d'un prestataire, sont partagées).
const CLIENT_ONLY = new Set(['(tabs)', 'booking', 'reservation', 'profile']);
const PROVIDER_ONLY = new Set(['(provider)', 'request', 'job']);
const APPLICANT_ONLY = new Set(['apply']);
// Écran « Adhésions » : réservé aux comptes de la table admins (is_admin).
const ADMIN_ONLY = new Set(['admin']);

/**
 * Redirige selon l'état de session et le rôle :
 *  - non connecté hors du groupe (auth) -> écran de connexion ;
 *  - connecté : attend que le rôle soit chargé, puis envoie un prestataire vers
 *    ses onglets (demandes) et un client vers l'app client, en les sortant des
 *    routes réservées à l'autre rôle (et du groupe (auth)) ; un demandeur
 *    d'adhésion reste cantonné au formulaire / statut de sa demande (/apply).
 *
 * Inactif tant que Supabase n'est pas configuré (l'app reste accessible en démo).
 */
export function useAuthGuard(): void {
  const status = useAuthStatus();
  const role = useRole();
  const isAdmin = useIsAdmin();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured || status === 'loading') return;

    const first: string = segments[0] ?? '';
    const inAuthGroup = first === '(auth)';
    if (status === 'anonymous') {
      if (!inAuthGroup) router.replace('/login');
      return;
    }
    if (role === null) return; // rôle en cours de chargement

    if (ADMIN_ONLY.has(first) && !isAdmin) {
      router.replace('/');
    } else if (role === 'applicant') {
      if (!APPLICANT_ONLY.has(first)) router.replace('/apply');
    } else if (
      role === 'provider' &&
      (inAuthGroup || first === '' || CLIENT_ONLY.has(first) || APPLICANT_ONLY.has(first))
    ) {
      router.replace('/requests');
    } else if (
      role === 'client' &&
      (inAuthGroup || PROVIDER_ONLY.has(first) || APPLICANT_ONLY.has(first))
    ) {
      router.replace('/');
    }
  }, [status, role, isAdmin, segments, router]);
}
