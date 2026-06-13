import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import { getProvider } from '@/lib/mock-data';
import { useAppStore } from '@/lib/store';
import type { Conversation, Message } from '@/lib/types';

interface ConversationItem {
  conversation: Conversation;
  providerName: string;
  serviceName: string;
  preview: string;
}

export default function ChatsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { formatRelative } = useFormats();
  const conversations = useAppStore((s) => s.conversations);
  const messages = useAppStore((s) => s.messages);
  const bookings = useAppStore((s) => s.bookings);

  const items = useMemo<ConversationItem[]>(() => {
    const previewOf = (message: Message | undefined): string => {
      if (!message) return t('common.newConversation');
      switch (message.type) {
        case 'quote':
          return t('chats.quoteReceived');
        case 'document':
          return message.document?.name ?? 'Document';
        default:
          return message.text;
      }
    };

    return [...conversations]
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      .map((conversation) => {
        const lastMessage = [...messages]
          .reverse()
          .find((m) => m.conversationId === conversation.id);
        const booking = bookings.find((b) => b.id === conversation.bookingId);
        return {
          conversation,
          providerName: getProvider(conversation.providerId)?.name ?? t('common.provider'),
          serviceName: booking ? t(`services.${booking.serviceId}.categoryName`) : '',
          preview: previewOf(lastMessage),
        };
      });
  }, [conversations, messages, bookings, t]);

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <AppText variant="title">{t('chats.title')}</AppText>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.conversation.id}
        contentContainerStyle={
          items.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={<MessageCircle size={32} color={colors.primary} />}
            title={t('chats.emptyTitle')}
            message={t('chats.emptyMessage')}
            actionLabel={t('common.bookService')}
            onAction={() => router.push('/(tabs)/reserver')}
          />
        }
        renderItem={({ item }) => {
          const { conversation } = item;
          const unread = conversation.unreadCount > 0;
          return (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/chat/[id]', params: { id: conversation.id } })
              }
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: colors.backgroundElement },
              ]}>
              <Avatar name={item.providerName} size={50} />
              <View style={styles.rowTexts}>
                <View style={styles.rowTop}>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                    {item.providerName}
                  </Text>
                  <Text
                    style={[
                      styles.time,
                      { color: unread ? colors.primary : colors.textSecondary },
                    ]}>
                    {formatRelative(conversation.lastMessageAt)}
                  </Text>
                </View>
                <Text style={[styles.service, { color: colors.primary }]}>
                  {item.serviceName}
                </Text>
                <View style={styles.rowBottom}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.preview,
                      { color: unread ? colors.text : colors.textSecondary },
                      unread && styles.previewUnread,
                    ]}>
                    {item.preview}
                  </Text>
                  {unread ? (
                    <View style={[styles.unreadDot, { backgroundColor: colors.primary }]}>
                      <Text style={styles.unreadCount}>{conversation.unreadCount}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  listContent: { paddingBottom: Spacing.five },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.three + 50 + Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  rowTexts: { flex: 1, gap: 2 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  name: { fontSize: FontSize.base, fontWeight: '600', flex: 1 },
  time: { fontSize: FontSize.xs },
  service: { fontSize: FontSize.xs, fontWeight: '600' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  preview: { fontSize: FontSize.sm, flex: 1 },
  previewUnread: { fontWeight: '600' },
  unreadDot: {
    minWidth: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadCount: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
