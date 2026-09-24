import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Info } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { QuoteAcceptedCelebration } from '@/components/celebration/quote-accepted-celebration';
import { ChatComposer } from '@/components/chat/chat-composer';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ProviderAvatar } from '@/components/provider-avatar';
import { Font, FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCounterpartName } from '@/hooks/use-counterpart';
import { conversationState, reviewWindowOpen } from '@/lib/conversation-state';
import { haptics } from '@/lib/haptics';
import { useRole } from '@/lib/profile-store';
import { useOpenRequest } from '@/lib/provider-store';
import { useProvider } from '@/lib/providers-store';
import { useAppStore, useBooking, useConversation } from '@/lib/store';

export default function ChatScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const conversation = useConversation(id);
  const booking = useBooking(conversation?.bookingId);
  const allMessages = useAppStore((s) => s.messages);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const respondToQuote = useAppStore((s) => s.respondToQuote);
  const respondToReschedule = useAppStore((s) => s.respondToReschedule);
  const setActiveConversation = useAppStore((s) => s.setActiveConversation);
  const markConversationRead = useAppStore((s) => s.markConversationRead);
  const role = useRole();
  const isProvider = role === 'provider';
  const provider = useProvider(conversation?.providerId);
  const counterpartName = useCounterpartName();
  // Prestataire sur une demande encore ouverte : pas de ligne booking lisible.
  const openRequest = useOpenRequest(isProvider ? conversation?.bookingId : undefined);

  const [celebrating, setCelebrating] = useState(false);
  // Fermeture de la conversation évaluée à l'ouverture de l'écran (le serveur fait foi).
  const [now] = useState(() => new Date());

  const onRescheduleResponse = (messageId: string, accept: boolean) => {
    void respondToReschedule(messageId, accept).then((ok) => {
      if (ok && accept) haptics.success();
    });
  };

  const onQuoteResponse = (messageId: string, accept: boolean) => {
    void respondToQuote(messageId, accept).then((ok) => {
      if (!ok || !accept) return;
      haptics.success();
      setCelebrating(true);
    });
  };

  useEffect(() => {
    if (!id) return;
    setActiveConversation(id);
    return () => setActiveConversation(null);
  }, [id, setActiveConversation]);

  // Un message reçu pendant que l'écran est ouvert ré-incrémente unread_count
  // (trigger SQL) : on le remet à zéro tant que la conversation est visible.
  useEffect(() => {
    if (id && conversation && conversation.unreadCount > 0) {
      void markConversationRead(id);
    }
  }, [id, conversation, markConversationRead]);

  const messages = useMemo(
    () => allMessages.filter((m) => m.conversationId === id).reverse(),
    [allMessages, id],
  );

  if (!conversation) {
    return <Redirect href="/(tabs)/chats" />;
  }

  const serviceId = booking?.serviceId ?? openRequest?.serviceId;
  const serviceName = serviceId ? t(`services.${serviceId}.categoryName`) : '';
  const name = counterpartName(conversation);

  // Client : fiche du prestataire. Prestataire : sa mission (retenu) ou la demande.
  const openIdentity = () => {
    if (!isProvider) {
      router.push({ pathname: '/provider/[id]', params: { id: conversation.providerId } });
    }
  };
  const openDetails = () => {
    if (!isProvider) {
      router.push({ pathname: '/reservation/[id]', params: { id: conversation.bookingId } });
    } else if (booking) {
      router.push({ pathname: '/job/[id]', params: { id: booking.id } });
    } else if (openRequest) {
      router.push({ pathname: '/request/[id]', params: { id: openRequest.id } });
    }
  };
  const hasDetails = isProvider ? Boolean(booking ?? openRequest) : Boolean(booking);

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safe, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border, backgroundColor: colors.card },
        ]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Pressable onPress={openIdentity} disabled={isProvider} style={styles.headerIdentity}>
          <ProviderAvatar
            name={name}
            photoPath={isProvider ? null : provider?.photoPath}
            size={38}
          />
          <View style={styles.headerTexts}>
            <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
              {name}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
              numberOfLines={1}>
              {serviceName}
              {!isProvider && provider?.responseTime ? ` · ${provider.responseTime}` : ''}
            </Text>
          </View>
        </Pressable>
        {hasDetails ? (
          <Pressable onPress={openDetails} hitSlop={10} style={styles.headerButton}>
            <Info size={22} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          inverted
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onQuoteResponse={isProvider ? undefined : onQuoteResponse}
              onRescheduleResponse={isProvider ? undefined : onRescheduleResponse}
              reviewContext={
                booking
                  ? {
                      bookingId: booking.id,
                      viewer: isProvider ? 'provider' : 'client',
                      providerName: name,
                      canStillReview: reviewWindowOpen(booking, now),
                    }
                  : undefined
              }
            />
          )}
        />

        <ChatComposer
          state={conversationState(conversation, booking, Boolean(openRequest), now)}
          onSend={(text) => void sendMessage(conversation.id, text)}
        />
      </KeyboardAvoidingView>
      <QuoteAcceptedCelebration
        visible={celebrating}
        providerName={name}
        booking={booking}
        onClose={() => setCelebrating(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: { padding: Spacing.one },
  headerIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
  },
  headerTexts: { flex: 1 },
  headerName: { fontSize: FontSize.base, ...Font.semibold },
  headerSubtitle: { ...Font.regular, fontSize: FontSize.xs },
  listContent: { paddingVertical: Spacing.three },
  attachButton: { padding: Spacing.two, paddingBottom: 12 },
});
