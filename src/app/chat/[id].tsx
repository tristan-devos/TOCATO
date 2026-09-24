import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Info, Paperclip, SendHorizontal } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { QuoteAcceptedCelebration } from '@/components/celebration/quote-accepted-celebration';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ProviderAvatar } from '@/components/provider-avatar';
import { Font, FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCounterpartName } from '@/hooks/use-counterpart';
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
  const setActiveConversation = useAppStore((s) => s.setActiveConversation);
  const markConversationRead = useAppStore((s) => s.markConversationRead);
  const role = useRole();
  const isProvider = role === 'provider';
  const provider = useProvider(conversation?.providerId);
  const counterpartName = useCounterpartName();
  // Prestataire sur une demande encore ouverte : pas de ligne booking lisible.
  const openRequest = useOpenRequest(isProvider ? conversation?.bookingId : undefined);

  const [draft, setDraft] = useState('');
  const [celebrating, setCelebrating] = useState(false);

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

  const send = () => {
    void sendMessage(conversation.id, draft);
    setDraft('');
  };

  const attachComingSoon = () => {
    Alert.alert(t('chat.attachTitle'), t('chat.attachMessage'));
  };

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
            />
          )}
        />

        <View
          style={[
            styles.inputBar,
            { borderTopColor: colors.border, backgroundColor: colors.card },
          ]}>
          <Pressable onPress={attachComingSoon} hitSlop={8} style={styles.attachButton}>
            <Paperclip size={20} color={colors.textSecondary} />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
          />
          <Pressable
            onPress={send}
            disabled={draft.trim().length === 0}
            hitSlop={8}
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  draft.trim().length > 0 ? colors.primary : colors.backgroundElement,
              },
            ]}>
            <SendHorizontal
              size={18}
              color={draft.trim().length > 0 ? colors.onPrimary : colors.textSecondary}
            />
          </Pressable>
        </View>
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
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  attachButton: { padding: Spacing.two, paddingBottom: 12 },
  input: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingTop: 10,
    paddingBottom: 10,
    ...Font.regular,
    fontSize: FontSize.base,
    maxHeight: 110,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
