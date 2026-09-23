import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStatus } from '@/lib/auth-store';
import { useRole } from '@/lib/profile-store';
import { isSupabaseConfigured } from '@/lib/supabase';

// Premier segment des routes réservées à chaque rôle (les autres — chat,
// profil public d'un prestataire — sont partagées).
const CLIENT_ONLY = new Set(['(tabs)', 'booking', 'reservation', 'profile']);
const PROVIDER_ONLY = new Set(['(provider)', 'request', 'job']);

/**
 * Redirige selon l'état de session et le rôle :
 *  - non connecté hors du groupe (auth) -> écran de connexion ;
 *  - connecté : attend que le rôle soit chargé, puis envoie un prestataire vers
 *    ses onglets (demandes) et un client vers l'app client, en les sortant des
 *    routes réservées à l'autre rôle (et du groupe (auth)).
 *
 * Inactif tant que Supabase n'est pas configuré (l'app reste accessible en démo).
 */
export function useAuthGuard(): void {
  const status = useAuthStatus();
  const role = useRole();
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

    if (role === 'provider' && (inAuthGroup || first === '' || CLIENT_ONLY.has(first))) {
      router.replace('/requests');
    } else if (role === 'client' && (inAuthGroup || PROVIDER_ONLY.has(first))) {
      router.replace('/');
    }
  }, [status, role, segments, router]);
}
