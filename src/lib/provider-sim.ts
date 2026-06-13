/**
 * Simulation des réponses prestataire (TEMPORAIRE, côté client).
 *
 * Insère des messages « du prestataire » dans Supabase après un délai ; le
 * Realtime les répercute ensuite dans l'app comme s'ils venaient d'un vrai
 * prestataire. Destiné à être remplacé par une Edge Function côté serveur —
 * tout est volontairement regroupé ici pour faciliter cette bascule.
 */

import { CANNED_REPLIES } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import type { PriceRange } from '@/lib/types';

/** Insère un message prestataire ; échoue silencieusement si la conv n'existe plus. */
async function insertProviderMessage(
  conversationId: string,
  providerId: string,
  message: {
    type: 'text' | 'quote';
    text: string;
    quote?: { amount: number; details: string; status: 'pending' };
  },
): Promise<void> {
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_kind: 'provider',
    provider_id: providerId,
    type: message.type,
    text: message.text,
    quote: message.quote ?? null,
  });
}

/** Après une nouvelle demande : un accusé de réception puis un devis chiffré. */
export function simulateInitialReply(
  conversationId: string,
  providerId: string,
  firstName: string,
  estimate: PriceRange,
): void {
  setTimeout(() => {
    void insertProviderMessage(conversationId, providerId, {
      type: 'text',
      text: `Bonjour ${firstName} ! J'ai bien reçu votre demande, je la regarde et je vous envoie un devis rapidement.`,
    });
  }, 2_500);

  const amount = Math.round((estimate.min + estimate.max) / 2 / 5) * 5;
  setTimeout(() => {
    void insertProviderMessage(conversationId, providerId, {
      type: 'quote',
      text: 'Voici mon devis détaillé pour votre demande.',
      quote: {
        amount,
        details:
          "Main-d'œuvre, déplacement et matériel de base inclus. Ajustable après visite si besoin.",
        status: 'pending',
      },
    });
  }, 9_000);
}

/** Réponse passe-partout après un message du client. */
export function simulateCannedReply(
  conversationId: string,
  providerId: string,
  replyIndex: number,
): void {
  const text = CANNED_REPLIES[replyIndex % CANNED_REPLIES.length] ?? 'Bien reçu, merci !';
  setTimeout(
    () => {
      void insertProviderMessage(conversationId, providerId, { type: 'text', text });
    },
    2_000 + Math.random() * 1_500,
  );
}
