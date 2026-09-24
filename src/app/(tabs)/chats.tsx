import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ChatIllustration } from '@/components/illustrations/chat-illustration';
import { ProviderAvatar } from '@/components/provider-avatar';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { FadeInItem } from '@/components/ui/fade-in-item';
import { Screen } from '@/components/ui/screen';
import { ListSkeleton } from '@/components/ui/skeleton';
import { Font, FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCounterpartName } from '@/hooks/use-counterpart';
import { useFormats } from '@/hooks/use-formats';
import { useSystemMessageText } from '@/hooks/use-message-text';
import { useDataReady } from '@/lib/auth-store';
import { useRole } from '@/lib/profile-store';
import { useOpenRequests } from '@/lib/provider-store';
import { useProviders } from '@/lib/providers-store';
import { useAppStore } from '@/lib/store';
import type { Conversation, Message } from '@/lib/types';

interface ConversationItem {
  conversation: Conversation;
  providerName: string;
  /** Photo du prestataire (côté client) ; null côté prestataire (le client n'en a pas). */
  photoPath: string | null;
  serviceName: string;
  preview: string;
}

export default function ChatsScreen() {
  const colors = useTheme();
  const dataReady = useDataReady();
  const router = useRouter();
  const { t } = useTranslation();
  const { formatRelative } = useFormats();
  const conversations = useAppStore((s) => s.conversations);
  const messages = useAppStore((s) => s.messages);
  const bookings = useAppStore((s) => s.bookings);
  const role = useRole();
  const counterpartName = useCounterpartName();
  const systemText = useSystemMessageText();
  // Prestataire : une demande encore ouverte n'est connue que par list_open_requests.
  const openRequests = useOpenRequests();
  const providers = useProviders();

  const items = useMemo<ConversationItem[]>(() => {
    const previewOf = (message: Message | undefined): string => {
      if (!message) return t('common.newConversation');
      switch (message.type) {
        case 'quote':
          // Côté prestataire, le dernier devis de la conversation est le sien.
          return message.senderId === 'me'
            ? t('providerApp.quoteSentBadge')
            : t('chats.quoteReceived');
        case 'system':
          return systemText(message);
        case 'document':
          return message.document?.name ?? 'Document';
        case 'reschedule':
          return t('reschedule.cardTitle');
        case 'review_request':
          return t('review.preview');
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
        const serviceId =
          bookings.find((b) => b.id === conversation.bookingId)?.serviceId ??
          openRequests.find((r) => r.id === conversation.bookingId)?.serviceId;
        return {
          conversation,
          providerName: counterpartName(conversation),
          photoPath:
            role === 'provider'
              ? null
              : (providers.find((p) => p.id === conversation.providerId)?.photoPath ?? null),
          serviceName: serviceId ? t(`services.${serviceId}.categoryName`) : '',
          preview: previewOf(lastMessage),
        };
      });
  }, [
    conversations,
    messages,
    bookings,
    openRequests,
    providers,
    role,
    counterpartName,
    systemText,
    t,
  ]);

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <AppText variant="title">{t('chats.title')}</AppText>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.conversation.id}
        contentContainerStyle={
          items.length === 0 && dataReady ? styles.emptyContainer : styles.listContent
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        ListEmptyComponent={
          dataReady ? (
            <EmptyState
              illustration={<ChatIllustration />}
              title={t('chats.emptyTitle')}
              message={t(role === 'provider' ? 'providerApp.chatsEmpty' : 'chats.emptyMessage')}
              actionLabel={role === 'provider' ? undefined : t('common.bookService')}
              onAction={role === 'provider' ? undefined : () => router.push('/(tabs)/reserver')}
            />
          ) : (
            <ListSkeleton variant="row" />
          )
        }
        renderItem={({ item, index }) => {
          const { conversation } = item;
          const unread = conversation.unreadCount > 0;
          return (
            <FadeInItem index={index}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/chat/[id]', params: { id: conversation.id } })
                }
                style={({ pressed }) => [
                  styles.row,
                  pressed && { backgroundColor: colors.backgroundElement },
                ]}>
                <ProviderAvatar name={item.providerName} photoPath={item.photoPath} size={50} />
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
            </FadeInItem>
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
  name: { fontSize: FontSize.base, ...Font.semibold, flex: 1 },
  time: { ...Font.regular, fontSize: FontSize.xs },
  service: { fontSize: FontSize.xs, ...Font.semibold },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  preview: { ...Font.regular, fontSize: FontSize.sm, flex: 1 },
  previewUnread: { ...Font.semibold },
  unreadDot: {
    minWidth: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadCount: { color: '#FFFFFF', fontSize: 11, ...Font.bold },
});
