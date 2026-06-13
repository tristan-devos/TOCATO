import { FileText, Paperclip } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import type { Message } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
  onQuoteResponse: (messageId: string, accept: boolean) => void;
}

export function MessageBubble({ message, onQuoteResponse }: MessageBubbleProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatPrice, formatTime } = useFormats();
  const mine = message.senderId === 'me';

  if (message.type === 'system') {
    return (
      <View style={styles.systemRow}>
        <Text style={[styles.systemText, { color: colors.textSecondary }]}>{message.text}</Text>
      </View>
    );
  }

  if (message.type === 'quote' && message.quote) {
    const { quote } = message;
    return (
      <View style={[styles.row, styles.rowLeft]}>
        <View
          style={[styles.quoteCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <View style={styles.quoteHeader}>
            <FileText size={18} color={colors.primary} />
            <Text style={[styles.quoteTitle, { color: colors.text }]}>
              {t('messageBubble.quote')}
            </Text>
            {quote.status === 'accepted' ? (
              <Badge label={t('messageBubble.accepted')} tone="success" />
            ) : null}
            {quote.status === 'declined' ? (
              <Badge label={t('messageBubble.declined')} tone="neutral" />
            ) : null}
          </View>
          <Text style={[styles.quoteAmount, { color: colors.primary }]}>
            {formatPrice(quote.amount)}
          </Text>
          <Text style={[styles.quoteDetails, { color: colors.textSecondary }]}>
            {quote.details}
          </Text>
          {message.text ? (
            <Text style={[styles.quoteNote, { color: colors.text }]}>{message.text}</Text>
          ) : null}
          {quote.status === 'pending' ? (
            <View style={styles.quoteActions}>
              <Button
                title={t('messageBubble.decline')}
                variant="outline"
                size="sm"
                onPress={() => onQuoteResponse(message.id, false)}
                style={styles.quoteAction}
              />
              <Button
                title={t('messageBubble.accept')}
                size="sm"
                onPress={() => onQuoteResponse(message.id, true)}
                style={styles.quoteAction}
              />
            </View>
          ) : null}
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {formatTime(message.createdAt)}
          </Text>
        </View>
      </View>
    );
  }

  if (message.type === 'document' && message.document) {
    return (
      <View style={[styles.row, mine ? styles.rowRight : styles.rowLeft]}>
        <View
          style={[
            styles.documentCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={[styles.documentIcon, { backgroundColor: colors.primaryMuted }]}>
            <Paperclip size={18} color={colors.primary} />
          </View>
          <View style={styles.documentTexts}>
            <Text style={[styles.documentName, { color: colors.text }]} numberOfLines={1}>
              {message.document.name}
            </Text>
            <Text style={[styles.documentSize, { color: colors.textSecondary }]}>
              {message.document.size}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, mine ? styles.rowRight : styles.rowLeft]}>
      <View
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
        ]}>
        <Text style={[styles.text, { color: mine ? colors.onPrimary : colors.text }]}>
          {message.text}
        </Text>
        <Text
          style={[
            styles.time,
            { color: mine ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
          ]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 3, paddingHorizontal: Spacing.three },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  systemRow: {
    alignItems: 'center',
    marginVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  systemText: { fontSize: FontSize.xs, textAlign: 'center' },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    gap: 2,
  },
  text: { fontSize: FontSize.base, lineHeight: 21 },
  time: { fontSize: 10, alignSelf: 'flex-end' },
  quoteCard: {
    maxWidth: '85%',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  quoteHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  quoteTitle: { fontSize: FontSize.base, fontWeight: '700', flex: 1 },
  quoteAmount: { fontSize: FontSize.xl, fontWeight: '800' },
  quoteDetails: { fontSize: FontSize.sm, lineHeight: 19 },
  quoteNote: { fontSize: FontSize.sm },
  quoteActions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  quoteAction: { flex: 1 },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    maxWidth: '78%',
  },
  documentIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentTexts: { flexShrink: 1 },
  documentName: { fontSize: FontSize.sm, fontWeight: '600' },
  documentSize: { fontSize: FontSize.xs },
});
