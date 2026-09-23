import { useLocalSearchParams, useRouter } from 'expo-router';
import { Inbox, Lock } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { QuoteForm } from '@/components/provider/quote-form';
import { BookingSummary } from '@/components/reservation/booking-summary';
import { RequestDetails } from '@/components/reservation/request-details';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import { formatSector } from '@/lib/format';
import { useOpenRequest } from '@/lib/provider-store';

/**
 * Demande ouverte vue par un prestataire : détails sans adresse exacte, puis
 * son devis (formulaire, ou état de celui déjà envoyé).
 */
export default function RequestDetailScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { formatPriceRange } = useFormats();
  const { id } = useLocalSearchParams<{ id: string }>();
  const request = useOpenRequest(id);

  const openChat = (conversationId: string) =>
    router.replace({ pathname: '/chat/[id]', params: { id: conversationId } });

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <PageHeader title={t('providerApp.requestTitle')} />
      {!request ? (
        // Plus dans la liste : pourvue par un autre prestataire, ou annulée.
        <View style={styles.closed}>
          <EmptyState
            icon={<Inbox size={32} color={colors.primary} />}
            title={t('providerApp.requestClosed')}
            message={t('providerApp.requestClosedMessage')}
          />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <BookingSummary serviceId={request.serviceId} createdAt={request.createdAt} />

            <RequestDetails
              answers={request.answers}
              description={request.description}
              photos={request.photos}
              location={formatSector(request.city, request.postalSector)}
              scheduledDate={request.scheduledDate}
              timeSlot={request.timeSlot}
            />

            <Card style={styles.note}>
              <Lock size={16} color={colors.textSecondary} />
              <AppText variant="small" color={colors.textSecondary} style={styles.noteText}>
                {t('providerApp.addressHidden')}
              </AppText>
            </Card>
            <AppText variant="small" color={colors.textSecondary}>
              {t('providerApp.clientEstimate', { range: formatPriceRange(request.estimate) })}
            </AppText>

            {request.myQuoteStatus === 'pending' && request.myConversationId ? (
              <Card style={styles.pending}>
                <AppText variant="secondary">{t('providerApp.quotePending')}</AppText>
                <Button
                  title={t('providerApp.openConversation')}
                  variant="outline"
                  onPress={() => openChat(request.myConversationId ?? '')}
                />
              </Card>
            ) : (
              <>
                {request.myQuoteStatus === 'declined' ? (
                  <AppText variant="secondary">{t('providerApp.quoteDeclined')}</AppText>
                ) : null}
                <QuoteForm requestId={request.id} onSent={openChat} />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
  closed: { flex: 1, justifyContent: 'center' },
  note: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2 },
  noteText: { flex: 1 },
  pending: { gap: Spacing.three },
});
