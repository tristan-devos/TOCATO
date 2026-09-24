import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OfferCard } from '@/components/reservation/offer-card';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useProviders } from '@/lib/providers-store';
import { useAppStore } from '@/lib/store';
import type { Conversation, Provider, ServiceId } from '@/lib/types';

interface ProviderOffersProps {
  bookingId: string;
  serviceId: ServiceId;
}

interface Offer {
  conversation: Conversation;
  provider: Provider | undefined;
  /** Montant du dernier devis en attente, s'il y en a un. */
  quoteAmount: number | undefined;
}

/**
 * Offres reçues sur une demande ouverte : chaque prestataire intéressé a ouvert
 * sa conversation ; une carte par offre, tap = ouvrir la conversation.
 */
export function ProviderOffers({ bookingId, serviceId }: ProviderOffersProps) {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const conversations = useAppStore((s) => s.conversations);
  const messages = useAppStore((s) => s.messages);
  const providers = useProviders();

  const offers = useMemo<Offer[]>(
    () =>
      conversations
        .filter((c) => c.bookingId === bookingId)
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
        .map((conversation) => {
          const quote = [...messages]
            .reverse()
            .find(
              (m) =>
                m.conversationId === conversation.id && m.quote?.status === 'pending',
            );
          return {
            conversation,
            provider: providers.find((p) => p.id === conversation.providerId),
            quoteAmount: quote?.quote?.amount,
          };
        }),
    [conversations, messages, providers, bookingId],
  );

  return (
    <View>
      <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
        {offers.length > 0
          ? t('providerOffers.title', { count: offers.length })
          : t('reservationDetail.providerSection')}
      </AppText>

      {offers.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Clock size={20} color={colors.primary} />
          <AppText variant="secondary" style={styles.emptyText}>
            {t('providerOffers.waiting')}
          </AppText>
        </Card>
      ) : (
        <View style={styles.list}>
          {offers.map(({ conversation, provider, quoteAmount }) =>
            provider ? (
              <OfferCard
                key={conversation.id}
                provider={provider}
                serviceId={serviceId}
                quoteAmount={quoteAmount}
                onPress={() =>
                  router.push({ pathname: '/chat/[id]', params: { id: conversation.id } })
                }
              />
            ) : null,
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { marginBottom: Spacing.two, marginLeft: Spacing.one },
  list: { gap: Spacing.three },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2 },
  emptyText: { flex: 1 },
});
