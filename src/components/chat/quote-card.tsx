import { CalendarDays, Clock, FileText, ShieldCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useTheme } from '@/hooks/use-theme';
import type { Message, Quote } from '@/lib/types';

interface QuoteCardProps {
  message: Message;
  quote: Quote;
  /** Son propre devis (prestataire) : à droite, sans boutons. */
  mine: boolean;
  /** Client uniquement : accepter/refuser. Absent = pas de boutons. */
  onRespond?: (messageId: string, accept: boolean) => void;
}

/**
 * Fiche devis dans le chat : lignes, total taxes comprises, date proposée, durée,
 * garantie, ce qui est inclus. Un ancien devis (montant + détails) s'affiche aussi.
 */
export function QuoteCard({ message, quote, mine, onRespond }: QuoteCardProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatPrice, formatDateLong, formatTime } = useFormats();
  const canRespond = !mine && quote.status === 'pending' && onRespond;
  const facts = [
    quote.proposedDate
      ? {
          icon: CalendarDays,
          text: `${formatDateLong(quote.proposedDate)}${
            quote.proposedSlot ? ` · ${t(`timeSlots.${quote.proposedSlot}`).toLowerCase()}` : ''
          }`,
        }
      : null,
    quote.durationHours !== undefined
      ? { icon: Clock, text: t('quoteCard.duration', { count: quote.durationHours }) }
      : null,
    quote.warranty ? { icon: ShieldCheck, text: quote.warranty } : null,
  ].filter((fact) => fact !== null);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary }]}>
      <View style={styles.header}>
        <FileText size={18} color={colors.primary} />
        <AppText variant="label" style={styles.title}>
          {t('messageBubble.quote')}
        </AppText>
        {quote.status === 'accepted' ? (
          <Badge label={t('messageBubble.accepted')} tone="success" />
        ) : null}
        {quote.status === 'declined' ? (
          <Badge label={t('messageBubble.declined')} tone="neutral" />
        ) : null}
      </View>

      {quote.lines?.map((line, index) => (
        <View key={`${line.label}-${index}`} style={styles.line}>
          <View style={styles.lineTexts}>
            <AppText variant="body">{line.label}</AppText>
            <AppText variant="small">{t(`quoteForm.categories.${line.category}`)}</AppText>
          </View>
          <AppText variant="label">{formatPrice(line.amount)}</AppText>
        </View>
      ))}

      <View style={[styles.total, { borderTopColor: colors.border }]}>
        <AppText variant="small">{t('quoteForm.total')}</AppText>
        <AppText variant="title" color={colors.primary}>
          {formatPrice(quote.amount)}
        </AppText>
      </View>

      {facts.map((fact) => (
        <View key={fact.text} style={styles.fact}>
          <fact.icon size={16} color={colors.textSecondary} />
          <AppText variant="secondary" style={styles.factText}>
            {fact.text}
          </AppText>
        </View>
      ))}
      {quote.details ? <AppText variant="secondary">{quote.details}</AppText> : null}

      {canRespond ? (
        <View style={styles.actions}>
          <Button
            title={t('messageBubble.decline')}
            variant="outline"
            size="sm"
            onPress={() => onRespond(message.id, false)}
            style={styles.action}
          />
          <Button
            title={t('messageBubble.accept')}
            size="sm"
            onPress={() => onRespond(message.id, true)}
            style={styles.action}
          />
        </View>
      ) : null}
      {mine && quote.status === 'pending' ? (
        <Badge label={t('messageBubble.awaitingAnswer')} tone="warning" />
      ) : null}
      <AppText variant="small" style={styles.time}>
        {formatTime(message.createdAt)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '88%',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: Spacing.two + 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1 },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  lineTexts: { flex: 1, gap: Spacing.half },
  total: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    gap: Spacing.half,
  },
  fact: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  factText: { flex: 1 },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  action: { flex: 1 },
  time: { alignSelf: 'flex-end' },
});
