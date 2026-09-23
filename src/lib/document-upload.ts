/**
 * Pièces justificatives d'une demande d'adhésion (bucket Storage privé
 * `provider-documents`, lisible par le propriétaire et l'admin seulement).
 *
 * Chemin `{userId}/{horodatage}-{kind}.jpg` : un nouveau chemin à chaque envoi (pas
 * d'update dans les policies Storage), l'ancien reste jusqu'au nettoyage (lot 5).
 */

import { base64ToBytes, type LocalPhoto } from '@/lib/photo-upload';
import { supabase } from '@/lib/supabase';

const BUCKET = 'provider-documents';
const SIGNED_URL_TTL = 60 * 10; // 10 min : le temps d'examiner une demande.

export type DocumentKind = 'id' | 'insurance';

/** Téléverse une pièce ; renvoie son chemin Storage, ou null en cas d'échec. */
export async function uploadProviderDocument(
  userId: string,
  kind: DocumentKind,
  photo: LocalPhoto,
): Promise<string | null> {
  if (photo.base64.length === 0) return null;
  const path = `${userId}/${Date.now()}-${kind}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, base64ToBytes(photo.base64), { contentType: 'image/jpeg' });
  return error ? null : path;
}

/** URL signée d'une pièce (le demandeur pour la sienne, l'admin pour toutes). */
export async function getProviderDocumentUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}
