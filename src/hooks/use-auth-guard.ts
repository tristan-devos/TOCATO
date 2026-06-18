import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStatus } from '@/lib/auth-store';
import { isSupabaseConfigured } from '@/lib/supabase';

/**
 * Redirige selon l'état de session :
 *  - non connecté hors du groupe (auth) -> écran de connexion ;
 *  - connecté à l'intérieur du groupe (auth) -> application.
 *
 * Inactif tant que Supabase n'est pas configuré (l'app reste accessible en démo).
 */
export function useAuthGuard(): void {
  const status = useAuthStatus();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured || status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';
    if (status === 'anonymous' && !inAuthGroup) {
      router.replace('/login');
    } else if (status === 'authenticated' && inAuthGroup) {
      router.replace('/');
    }
  }, [status, segments, router]);
}
