import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProviderAvatar } from '@/components/provider-avatar';
import { Font, FontSize, Radius, Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useTheme } from '@/hooks/use-theme';
import type { Conversation } from '@/lib/types';

export const CONVERSATION_AVATAR_SIZE = 50;

export interface ConversationItem {
  conversation: Conversation;
  providerName: string;
  /** Photo du prestataire (côté client) ; null côté prestataire (le client n'en a pas). */
  photoPath: string | null;
  serviceName: string;
  preview: string;
}

/** Une ligne de la liste Messages : interlocuteur, service, aperçu, non-lus. */
export function ConversationRow({ item }: { item: ConversationItem }) {
  const colors = useTheme();
  const router = useRouter();
  const { formatRelative } = useFormats();
  const { conversation } = item;
  const unread = conversation.unreadCount > 0;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: conversation.id } })}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.backgroundElement }]}>
      <ProviderAvatar
        name={item.providerName}
        photoPath={item.photoPath}
        size={CONVERSATION_AVATAR_SIZE}
      />
      <View style={styles.rowTexts}>
        <View style={styles.rowTop}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {item.providerName}
          </Text>
          <Text style={[styles.time, { color: unread ? colors.primary : colors.textSecondary }]}>
            {formatRelative(conversation.lastMessageAt)}
          </Text>
        </View>
        <Text style={[styles.service, { color: colors.primary }]}>{item.serviceName}</Text>
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
              <Text style={[styles.unreadCount, { color: colors.onPrimary }]}>
                {conversation.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  unreadCount: { fontSize: 11, ...Font.bold },
});
