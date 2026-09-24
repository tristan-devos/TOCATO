/**
 * Photos des prestataires (bucket Storage privé `provider-photos`,
 * docs/experience-emotionnelle.md §5).
 *
 * Chemin `{userId}/{uuid}.jpg` : un nouveau nom à chaque envoi, donc une image mise en
 * cache sous son chemin ne devient jamais périmée. Une photo publiée est lisible par
 * tout compte connecté, les autres par leur propriétaire et l'admin (RLS Storage).
 * Affichage par URL signée longue, gardée en mémoire : l'URL change à chaque
 * signature, l'image reste en cache (expo-image, `cacheKey` = chemin).
 */

import { randomUUID } from 'expo-crypto';
import { useEffect, useState } from 'react';

import { base64ToBytes, type LocalPhoto } from '@/lib/photo-upload';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import type { ProviderPhotoChange } from '@/lib/types';

type PhotoChangeRow = Database['public']['Tables']['provider_photo_changes']['Row'];

const BUCKET = 'provider-photos';
const SIGNED_URL_TTL_S = 7 * 24 * 60 * 60; // 7 jours
// Marge : une URL qui expire dans l'heure est re-signée.
const RENEW_BEFORE_MS = 60 * 60 * 1000;

const signed = new Map<string, { url: string; expiresAt: number }>();
const pending = new Map<string, Promise<string | null>>();

/** URL signée d'une photo (mise en mémoire jusqu'à peu avant son expiration). */
export function getProviderPhotoUrl(path: string): Promise<string | null> {
  const cached = signed.get(path);
  if (cached && cached.expiresAt - RENEW_BEFORE_MS > Date.now()) {
    return Promise.resolve(cached.url);
  }
  const inFlight = pending.get(path);
  if (inFlight) return inFlight;
  const request = supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_S)
    .then(({ data }) => {
      pending.delete(path);
      const url = data?.signedUrl ?? null;
      if (url) signed.set(path, { url, expiresAt: Date.now() + SIGNED_URL_TTL_S * 1000 });
      return url;
    });
  pending.set(path, request);
  return request;
}

/** URL affichable d'une photo, ou null (pas de photo, ou pas encore signée). */
export function useProviderPhotoUrl(path: string | null | undefined): string | null {
  // L'URL est rangée avec son chemin : si le chemin change, l'ancienne n'est plus
  // renvoyée (pas de remise à zéro synchrone dans l'effet).
  const [resolved, setResolved] = useState<{ path: string; url: string | null } | null>(null);
  useEffect(() => {
    if (!path) return;
    let active = true;
    void getProviderPhotoUrl(path).then((url) => {
      if (active) setResolved({ path, url });
    });
    return () => {
      active = false;
    };
  }, [path]);
  if (!path) return null;
  if (resolved?.path === path) return resolved.url;
  // Déjà signée (autre écran) : affichée tout de suite, sans attendre l'effet.
  return signed.get(path)?.url ?? null;
}

/** Téléverse une photo dans le dossier du compte ; renvoie son chemin, ou null. */
export async function uploadProviderPhoto(
  userId: string,
  photo: LocalPhoto,
): Promise<string | null> {
  if (photo.base64.length === 0) return null;
  const path = `${userId}/${randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, base64ToBytes(photo.base64), { contentType: 'image/jpeg' });
  return error ? null : path;
}

/** Proposition de photo du prestataire connecté (en attente ou refusée), ou null. */
export async function loadMyPhotoChange(): Promise<ProviderPhotoChange | null> {
  // La RLS ne lui ouvre que la sienne (au plus une ligne).
  const { data } = await supabase.from('provider_photo_changes').select('*').maybeSingle();
  return data ? rowToPhotoChange(data) : null;
}

/** Ligne provider_photo_changes -> domaine (partagé avec admin-store). */
export function rowToPhotoChange(row: PhotoChangeRow): ProviderPhotoChange {
  return {
    providerId: row.provider_id,
    status: row.status,
    photoPath: row.photo_path,
    submittedAt: row.submitted_at,
    rejectionReason: row.rejection_reason,
  };
}

/** Propose une nouvelle photo : téléversement puis RPC ; renvoie un code d'erreur ou null. */
export async function submitProviderPhoto(photo: LocalPhoto): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return 'not_authenticated';
  const path = await uploadProviderPhoto(userId, photo);
  if (!path) return 'upload_failed';
  const { error } = await supabase.rpc('submit_provider_photo', { p_photo_path: path });
  return error ? error.message : null;
}
