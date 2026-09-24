import { BadgeCheck, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProviderAvatar } from '@/components/provider-avatar';
import { Rating } from '@/components/rating';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useTheme } from '@/hooks/use-theme';
import type { Provider, ServiceId } from '@/lib/types';

interface OfferCardProps {
  provider: Provider;
  serviceId: ServiceId;
  /** Montant du devis en attente, s'il y en a un. */
  quoteAmount: number | undefined;
  onPress: () => void;
}

/**
 * Une offre reçue sur une demande ouverte : c'est ici que la confiance se décide.
 * Grand visage, vérifications visibles, montant mis en valeur.
 */
export function OfferCard({ provider, serviceId, quoteAmount, onPress }: OfferCardProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatPrice } = useFormats();
  // En plomberie, l'approbation exige une licence RBQ (15.5) vérifiée au registre.
  const checks = provider.verified
    ? [
        t('providerOffers.verified'),
        ...(serviceId === 'plumber' ? [t('providerOffers.rbqVerified')] : []),
      ]
    : [];

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.identity}>
        <ProviderAvatar name={provider.name} photoPath={provider.photoPath} size={64} />
        <View style={styles.texts}>
          <View style={styles.nameRow}>
            <AppText variant="subheading" numberOfLines={1} style={styles.name}>
              {provider.name}
            </AppText>
            {provider.verified ? <BadgeCheck size={18} color={colors.primary} /> : null}
          </View>
          {/* Sans avis, « 0,0 » desservirait un prestataire vérifié : on dit qu'il débute. */}
          {provider.reviewCount > 0 ? (
            <Rating rating={provider.rating} reviewCount={provider.reviewCount} />
          ) : (
            <AppText variant="small">{t('providerOffers.newProvider')}</AppText>
          )}
        </View>
      </View>

      {checks.length > 0 ? (
        <View style={styles.checks}>
          {checks.map((label) => (
            <View key={label} style={[styles.check, { backgroundColor: colors.primaryMuted }]}>
              <ShieldCheck size={14} color={colors.primary} />
              <AppText variant="small" color={colors.primary}>
                {label}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {quoteAmount != null ? (
          <View>
            <AppText variant="small">{t('providerOffers.quoteLabel')}</AppText>
            <AppText variant="title" color={colors.primary}>
              {formatPrice(quoteAmount)}
            </AppText>
          </View>
        ) : (
          <AppText variant="secondary">{t('providerOffers.noQuoteYet')}</AppText>
        )}
        <View style={styles.cta}>
          <AppText variant="label" color={colors.primary}>
            {t('providerOffers.viewOffer')}
          </AppText>
          <ChevronRight size={18} color={colors.primary} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  texts: { flex: 1, gap: Spacing.one },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  name: { flexShrink: 1 },
  checks: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  cta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
});
