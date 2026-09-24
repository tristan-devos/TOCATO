import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { StarRatingInput } from '@/components/ui/star-rating-input';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { fetchReview, submitReview } from '@/lib/reviews';
import type { Review } from '@/lib/types';

export interface ReviewContext {
  bookingId: string;
  viewer: 'client' | 'provider';
  /** Nom du prestataire (côté client, dans la question). */
  providerName: string;
  /** Délai de notation encore ouvert (30 jours après la fin). */
  canStillReview: boolean;
}

/**
 * Carte de fin de mission dans le chat : le client note le prestataire (1 à 5
 * étoiles, commentaire facultatif), une fois ; le prestataire voit la note reçue.
 */
export function ReviewCard({ bookingId, viewer, providerName, canStillReview }: ReviewContext) {
  const colors = useTheme();
  const { t } = useTranslation();
  const [review, setReview] = useState<Review | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchReview(bookingId).then((found) => {
      if (!active) return;
      setReview(found);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [bookingId]);

  const submit = async () => {
    setSending(true);
    setError(false);
    const failure = await submitReview(bookingId, rating, comment);
    if (failure) {
      setSending(false);
      setError(true);
      return;
    }
    haptics.success();
    setReview(await fetchReview(bookingId));
    setSending(false);
  };

  const body = () => {
    if (!loaded) return null;
    if (review) {
      return (
        <>
          <AppText variant="label">
            {viewer === 'client'
              ? t('review.given', { count: review.rating })
              : t('review.received', { count: review.rating })}
          </AppText>
          <StarRatingInput value={review.rating} size={20} />
          {review.comment ? (
            <AppText variant="secondary">« {review.comment} »</AppText>
          ) : null}
        </>
      );
    }
    if (viewer === 'provider') {
      return <AppText variant="secondary">{t('review.awaiting')}</AppText>;
    }
    if (!canStillReview) {
      return <AppText variant="secondary">{t('review.windowClosed')}</AppText>;
    }
    return (
      <>
        <AppText variant="subheading">{t('review.question', { name: providerName })}</AppText>
        <StarRatingInput value={rating} onChange={setRating} />
        {rating > 0 ? (
          <>
            <TextField
              label={t('review.commentLabel')}
              value={comment}
              onChangeText={setComment}
              placeholder={t('review.commentPlaceholder')}
              maxLength={500}
              multiline
            />
            <Button title={t('review.send')} loading={sending} onPress={() => void submit()} />
          </>
        ) : null}
        {error ? (
          <AppText variant="small" color={colors.destructive}>
            {t('review.error')}
          </AppText>
        ) : null}
      </>
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.accentMuted }]}>{body()}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.three,
    marginVertical: Spacing.two,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two + 2,
    alignItems: 'center',
  },
});
