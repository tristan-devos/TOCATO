import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProviderRow } from '@/components/provider-row';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import { getProvider } from '@/lib/mock-data';
import { useAppStore } from '@/lib/store';
import type { Conversation, Provider } from '@/lib/types';

interface ProviderOffersProps {
  bookingId: string;
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
export function ProviderOffers({ bookingId }: ProviderOffersProps) {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { formatPrice } = useFormats();
  const conversations = useAppStore((s) => s.conversations);
  const messages = useAppStore((s) => s.messages);

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
            provider: getProvider(conversation.providerId),
            quoteAmount: quote?.quote?.amount,
          };
        }),
    [conversations, messages, bookingId],
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
              <Card
                key={conversation.id}
                onPress={() =>
                  router.push({ pathname: '/chat/[id]', params: { id: conversation.id } })
                }>
                <ProviderRow
                  provider={provider}
                  subtitle={
                    quoteAmount != null
                      ? t('providerOffers.quoteReceived', { price: formatPrice(quoteAmount) })
                      : t('providerOffers.noQuoteYet')
                  }
                />
              </Card>
            ) : null,
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { marginBottom: Spacing.two, marginLeft: Spacing.one },
  list: { gap: Spacing.two },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2 },
  emptyText: { flex: 1 },
});
