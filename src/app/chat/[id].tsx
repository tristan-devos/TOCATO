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

import { MessageBubble } from '@/components/chat/message-bubble';
import { Avatar } from '@/components/ui/avatar';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getProvider } from '@/lib/mock-data';
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

  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!id) return;
    setActiveConversation(id);
    return () => setActiveConversation(null);
  }, [id, setActiveConversation]);

  // Un message reçu pendant que l'écran est ouvert ré-incrémente unread_count
  // (trigger SQL) — on le remet à zéro tant que la conversation est visible.
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

  const provider = getProvider(conversation.providerId);
  const serviceName = booking ? t(`services.${booking.serviceId}.categoryName`) : '';

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
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/provider/[id]',
              params: { id: conversation.providerId },
            })
          }
          style={styles.headerIdentity}>
          <Avatar name={provider?.name ?? '?'} size={38} />
          <View style={styles.headerTexts}>
            <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
              {provider?.name ?? t('common.provider')}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
              numberOfLines={1}>
              {serviceName ? `${serviceName} · ` : ''}
              {provider?.responseTime ?? ''}
            </Text>
          </View>
        </Pressable>
        {booking ? (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/reservation/[id]', params: { id: booking.id } })
            }
            hitSlop={10}
            style={styles.headerButton}>
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
            <MessageBubble message={item} onQuoteResponse={respondToQuote} />
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
  headerName: { fontSize: FontSize.base, fontWeight: '600' },
  headerSubtitle: { fontSize: FontSize.xs },
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
