import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  CONVERSATION_AVATAR_SIZE,
  ConversationRow,
  type ConversationItem,
} from '@/components/chat/conversation-row';
import { ChatIllustration } from '@/components/illustrations/chat-illustration';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { FadeInItem } from '@/components/ui/fade-in-item';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ListSkeleton } from '@/components/ui/skeleton';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCounterpartName } from '@/hooks/use-counterpart';
import { useSystemMessageText } from '@/hooks/use-message-text';
import { useDataReady } from '@/lib/auth-store';
import { splitConversations } from '@/lib/conversation-state';
import { useRole } from '@/lib/profile-store';
import { useOpenRequests } from '@/lib/provider-store';
import { useProviders } from '@/lib/providers-store';
import { useAppStore } from '@/lib/store';
import type { Conversation, Message } from '@/lib/types';

type Tab = 'active' | 'closed';

export default function ChatsScreen() {
  const colors = useTheme();
  const dataReady = useDataReady();
  const router = useRouter();
  const { t } = useTranslation();
  const conversations = useAppStore((s) => s.conversations);
  const messages = useAppStore((s) => s.messages);
  const bookings = useAppStore((s) => s.bookings);
  const role = useRole();
  const counterpartName = useCounterpartName();
  const systemText = useSystemMessageText();
  // Prestataire : une demande encore ouverte n'est connue que par list_open_requests.
  const openRequests = useOpenRequests();
  const providers = useProviders();
  const [tab, setTab] = useState<Tab>('active');
  // L'onglet reste monté : « maintenant » est relu à chaque retour, pour qu'une
  // conversation passe dans « Terminées » à la fin de ses 48 h.
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(useCallback(() => setNow(new Date()), []));

  const split = useMemo(
    () =>
      splitConversations(
        conversations,
        bookings,
        new Set(openRequests.map((r) => r.id)),
        now,
      ),
    [conversations, bookings, openRequests, now],
  );
  const closedUnread = split.closed.filter((c) => c.unreadCount > 0).length;
  // Pas de sélecteur tant que rien n'est terminé : la liste reste simple au début.
  const showTabs = split.closed.length > 0;
  const shown: Conversation[] = showTabs && tab === 'closed' ? split.closed : split.active;

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

    return [...shown]
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
  }, [shown, messages, bookings, openRequests, providers, role, counterpartName, systemText, t]);

  const closedTabShown = showTabs && tab === 'closed';

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <AppText variant="title">{t('chats.title')}</AppText>
        {showTabs ? (
          <SegmentedControl<Tab>
            options={[
              { id: 'active', label: t('chats.activeTab') },
              { id: 'closed', label: t('chats.closedTab'), badge: closedUnread },
            ]}
            value={tab}
            onChange={setTab}
          />
        ) : null}
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
          !dataReady ? (
            <ListSkeleton variant="row" />
          ) : closedTabShown ? (
            <EmptyState
              illustration={<ChatIllustration />}
              title={t('chats.closedEmptyTitle')}
              message={t('chats.closedEmptyMessage')}
            />
          ) : (
            <EmptyState
              illustration={<ChatIllustration />}
              title={t('chats.emptyTitle')}
              message={t(role === 'provider' ? 'providerApp.chatsEmpty' : 'chats.emptyMessage')}
              actionLabel={role === 'provider' ? undefined : t('common.bookService')}
              onAction={role === 'provider' ? undefined : () => router.push('/(tabs)/reserver')}
            />
          )
        }
        renderItem={({ item, index }) => (
          <FadeInItem index={index}>
            <ConversationRow item={item} />
          </FadeInItem>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.three,
  },
  listContent: { paddingBottom: Spacing.five },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.three + CONVERSATION_AVATAR_SIZE + Spacing.three,
  },
});
