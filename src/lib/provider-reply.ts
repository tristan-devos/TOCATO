/**
 * Déclenche la simulation des réponses prestataire — côté serveur.
 *
 * L'app n'insère jamais elle-même les données « du prestataire » : elle invoque
 * l'Edge Function `provider-reply`. Kind `initial` (bookingId) : les
 * prestataires du service viennent vers le client — chacun ouvre sa conversation
 * sur la demande puis envoie intro et devis. Kind `canned` (conversationId) :
 * réponse passe-partout quand le client écrit. La fonction insère avec la clé
 * service_role et le Realtime répercute dans le store.
 * Voir `supabase/functions/provider-reply`.
 */

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type ReplyRequest =
  | { kind: 'initial'; bookingId: string }
  | { kind: 'canned'; conversationId: string };

/**
 * Fire-and-forget : on n'attend pas la réponse de la fonction (les données
 * prestataire arrivent via Realtime). Sans Supabase configuré, ne fait rien.
 */
export function triggerProviderReply(request: ReplyRequest): void {
  if (!isSupabaseConfigured) return;
  void supabase.functions
    .invoke('provider-reply', { body: request })
    .then(({ error }) => {
      if (error && __DEV__) console.warn('[provider-reply]', error.message);
    });
}
