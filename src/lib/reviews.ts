/**
 * Avis sur le prestataire retenu (table reviews, supabase/reviews.sql). Lus par le
 * client auteur et le prestataire noté (RLS) ; écrits par submit_review, qui
 * recalcule la note de la fiche.
 */

import { useProvidersStore } from '@/lib/providers-store';
import { supabase } from '@/lib/supabase';
import type { Review } from '@/lib/types';

export async function fetchReview(bookingId: string): Promise<Review | null> {
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();
  if (!data) return null;
  return {
    bookingId: data.booking_id,
    providerId: data.provider_id,
    rating: data.rating,
    comment: data.comment,
    createdAt: data.created_at,
  };
}

/** Envoie la note ; renvoie un code d'erreur, ou null si c'est fait. */
export async function submitReview(
  bookingId: string,
  rating: number,
  comment: string,
): Promise<string | null> {
  const { error } = await supabase.rpc('submit_review', {
    p_booking_id: bookingId,
    p_rating: rating,
    p_comment: comment.trim(),
  });
  if (error) return error.message;
  // Note moyenne de la fiche recalculée côté serveur : on relit les fiches.
  await useProvidersStore.getState().loadProviders();
  return null;
}
