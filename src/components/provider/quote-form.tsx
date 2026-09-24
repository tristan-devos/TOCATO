import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { QuoteLinesEditor } from '@/components/provider/quote-lines-editor';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DaySlotPicker } from '@/components/ui/day-slot-picker';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { useProviderStore } from '@/lib/provider-store';
import {
  differsFromRequested,
  draftFor,
  draftTotal,
  proposableDays,
  validateDraft,
  type QuoteDraft,
  type QuoteDraftError,
} from '@/lib/quote-draft';
import type { OpenRequest } from '@/lib/types';

interface QuoteFormProps {
  request: OpenRequest;
  /** Appelé avec l'id de la conversation une fois le devis envoyé. */
  onSent: (conversationId: string) => void;
}

/**
 * Fiche devis d'un prestataire sur une demande ouverte (RPC send_quote) : lignes
 * chiffrées, date et créneau proposés, durée, ce qui est inclus, garantie.
 */
export function QuoteForm({ request, onSent }: QuoteFormProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatDateLong } = useFormats();
  const sendQuote = useProviderStore((s) => s.sendQuote);
  const [today] = useState(() => new Date());
  const days = useMemo(() => proposableDays(today), [today]);
  const [draft, setDraft] = useState<QuoteDraft>(() => draftFor(request, today));
  const [error, setError] = useState<QuoteDraftError | null>(null);
  const [sending, setSending] = useState(false);

  const patch = (next: Partial<QuoteDraft>) => setDraft((current) => ({ ...current, ...next }));

  const submit = async () => {
    const result = validateDraft(draft, today);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setError(null);
    setSending(true);
    const conversationId = await sendQuote(request.id, result.input);
    setSending(false);
    if (conversationId) {
      haptics.success();
      onSent(conversationId);
    } else {
      Alert.alert(t('providerApp.quoteErrorTitle'), t('providerApp.quoteErrorMessage'));
    }
  };

  const dateHint = request.scheduledDate
    ? t('quoteForm.requestedDate', { date: formatDateLong(request.scheduledDate) })
    : t('quoteForm.asapHint');

  return (
    <View style={styles.base}>
      <AppText variant="label" color={colors.textSecondary} style={styles.sectionLabel}>
        {t('providerApp.quoteSection')}
      </AppText>

      <Card style={styles.card}>
        <AppText variant="subheading">{t('quoteForm.linesTitle')}</AppText>
        <QuoteLinesEditor
          lines={draft.lines}
          onChange={(lines) => patch({ lines })}
          total={draftTotal(draft)}
        />
      </Card>

      <Card style={styles.card}>
        <AppText variant="subheading">{t('quoteForm.dateTitle')}</AppText>
        <AppText variant="secondary">{dateHint}</AppText>
        <DaySlotPicker
          days={days}
          date={draft.date}
          onDateChange={(date) => patch({ date })}
          slot={draft.slot}
          onSlotChange={(slot) => patch({ slot })}
          slotLabel={t('quoteForm.slotLabel')}
        />
        {draft.date && differsFromRequested(draft.date, request.scheduledDate) ? (
          <AppText variant="small" color={colors.warning}>
            {t('quoteForm.differsFromRequested')}
          </AppText>
        ) : null}
        <TextField
          label={t('quoteForm.durationLabel')}
          value={draft.durationText}
          onChangeText={(durationText) => patch({ durationText })}
          placeholder="2"
          keyboardType="decimal-pad"
        />
      </Card>

      <Card style={styles.card}>
        <TextField
          label={t('quoteForm.includedLabel')}
          value={draft.included}
          onChangeText={(included) => patch({ included })}
          placeholder={t('quoteForm.includedPlaceholder')}
          multiline
          maxLength={2000}
          style={styles.multiline}
        />
        <TextField
          label={t('quoteForm.warrantyLabel')}
          value={draft.warranty}
          onChangeText={(warranty) => patch({ warranty })}
          placeholder={t('quoteForm.warrantyPlaceholder')}
          maxLength={200}
        />
      </Card>

      {error ? (
        <AppText variant="secondary" color={colors.destructive}>
          {t(`quoteForm.errors.${error}`)}
        </AppText>
      ) : null}
      <Button
        title={t('providerApp.sendQuote')}
        size="lg"
        loading={sending}
        onPress={() => void submit()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.three },
  sectionLabel: { marginLeft: Spacing.one },
  card: { gap: Spacing.three },
  multiline: { minHeight: 96, paddingTop: Spacing.two + 4, textAlignVertical: 'top' },
});
