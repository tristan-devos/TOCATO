import { Paperclip } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { QuoteCard } from '@/components/chat/quote-card';
import { RescheduleCard } from '@/components/chat/reschedule-card';
import { ReviewCard, type ReviewContext } from '@/components/chat/review-card';
import { Font, FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import { useSystemMessageText } from '@/hooks/use-message-text';
import type { Message } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
  /** Client uniquement : accepter/refuser un devis. Absent = pas de boutons. */
  onQuoteResponse?: (messageId: string, accept: boolean) => void;
  /** Client uniquement : accepter/refuser une nouvelle date. Absent = pas de boutons. */
  onRescheduleResponse?: (messageId: string, accept: boolean) => void;
  /** Carte de fin de mission (note) : absente tant que la réservation n'est pas lisible. */
  reviewContext?: ReviewContext;
}

export function MessageBubble({
  message,
  onQuoteResponse,
  onRescheduleResponse,
  reviewContext,
}: MessageBubbleProps) {
  const colors = useTheme();
  const { formatTime } = useFormats();
  const mine = message.senderId === 'me';
  const systemText = useSystemMessageText();

  if (message.type === 'system') {
    return (
      <View style={styles.systemRow}>
        <Text style={[styles.systemText, { color: colors.textSecondary }]}>
          {systemText(message)}
        </Text>
      </View>
    );
  }

  if (message.type === 'quote' && message.quote) {
    return (
      <View style={[styles.row, mine ? styles.rowRight : styles.rowLeft]}>
        <QuoteCard
          message={message}
          quote={message.quote}
          mine={mine}
          onRespond={onQuoteResponse}
        />
      </View>
    );
  }

  if (message.type === 'review_request') {
    return reviewContext ? <ReviewCard {...reviewContext} /> : null;
  }

  if (message.type === 'reschedule' && message.reschedule) {
    return (
      <View style={[styles.row, mine ? styles.rowRight : styles.rowLeft]}>
        <RescheduleCard
          message={message}
          reschedule={message.reschedule}
          mine={mine}
          onRespond={onRescheduleResponse}
        />
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
  systemText: { ...Font.regular, fontSize: FontSize.xs, textAlign: 'center' },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    gap: 2,
  },
  text: { ...Font.regular, fontSize: FontSize.base, lineHeight: 21 },
  time: { ...Font.regular, fontSize: 10, alignSelf: 'flex-end' },
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
  documentName: { fontSize: FontSize.sm, ...Font.semibold },
  documentSize: { ...Font.regular, fontSize: FontSize.xs },
});
