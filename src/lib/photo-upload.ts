/**
 * Photos jointes aux demandes de réservation (bucket Supabase Storage privé).
 *
 * Le wizard sélectionne des images locales (`LocalPhoto` : uri pour l'aperçu,
 * base64 pour l'upload). À la création de la réservation, on les téléverse dans
 * `booking-photos/{userId}/{bookingId}/{n}.jpg` et on stocke les chemins sur la
 * ligne `bookings.photos`. L'affichage passe par des URLs signées (bucket privé).
 *
 * Le décodage base64 -> octets est fait à la main pour éviter une dépendance
 * supplémentaire (Hermes/React Native n'expose pas `Buffer`, et l'upload d'un
 * Blob issu de `fetch(file://)` est peu fiable côté Supabase RN).
 */

import { supabase } from '@/lib/supabase';

const BUCKET = 'booking-photos';
const SIGNED_URL_TTL = 60 * 60; // 1 h, suffisant pour la consultation d'un écran.

/** Image choisie dans le wizard, pas encore téléversée. */
export interface LocalPhoto {
  /** URI locale (file://) : pour l'aperçu dans le wizard. */
  uri: string;
  /** Contenu encodé en base64 : pour l'upload vers Storage. */
  base64: string;
}

const B64_LOOKUP = (() => {
  const table = new Uint8Array(256);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let i = 0; i < chars.length; i += 1) {
    table[chars.charCodeAt(i)] = i;
  }
  return table;
})();

/** Décode du base64 en octets (partagé avec document-upload). */
export function base64ToBytes(base64: string): Uint8Array {
  const padding = base64.indexOf('=');
  const clean = padding === -1 ? base64 : base64.slice(0, padding);
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let position = 0;
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i += 1) {
    buffer = (buffer << 6) | (B64_LOOKUP[clean.charCodeAt(i)] ?? 0);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[position] = (buffer >> bits) & 0xff;
      position += 1;
    }
  }
  return bytes;
}

/**
 * Téléverse les photos d'une réservation et renvoie leurs chemins Storage.
 * Best-effort : une photo qui échoue est simplement omise (la réservation a déjà
 * été créée : on ne bloque pas le flux pour un upload partiel).
 */
export async function uploadBookingPhotos(
  userId: string,
  bookingId: string,
  photos: LocalPhoto[],
): Promise<string[]> {
  const paths: string[] = [];
  for (let i = 0; i < photos.length; i += 1) {
    const photo = photos[i];
    if (!photo || photo.base64.length === 0) continue;
    const path = `${userId}/${bookingId}/${i}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, base64ToBytes(photo.base64), {
        contentType: 'image/jpeg',
        upsert: true,
      });
    if (!error) paths.push(path);
  }
  return paths;
}

/** Convertit des chemins Storage en URLs signées affichables (bucket privé). */
export async function getBookingPhotoUrls(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
  return (data ?? [])
    .map((entry) => entry.signedUrl)
    .filter((url): url is string => Boolean(url));
}
