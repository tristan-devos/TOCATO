/**
 * Déclenche la simulation des réponses prestataire — désormais côté serveur.
 *
 * L'app n'insère plus elle-même les messages « du prestataire » : elle invoque
 * l'Edge Function `provider-reply` (« réponds dans cette conversation, type
 * initial|canned »). La fonction insère les messages après délai avec la clé
 * service_role et le Realtime les répercute dans le store. Remplace l'ancien
 * `provider-sim.ts` (setTimeout côté client). Voir `supabase/functions/provider-reply`.
 */

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type ReplyKind = 'initial' | 'canned';

/**
 * Fire-and-forget : on n'attend pas la réponse de la fonction (les messages
 * prestataire arrivent via Realtime). Sans Supabase configuré, ne fait rien.
 */
export function triggerProviderReply(conversationId: string, kind: ReplyKind): void {
  if (!isSupabaseConfigured) return;
  void supabase.functions
    .invoke('provider-reply', { body: { conversationId, kind } })
    .then(({ error }) => {
      if (error && __DEV__) console.warn('[provider-reply]', error.message);
    });
}
