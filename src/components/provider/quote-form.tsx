import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parseAmountInput } from '@/lib/format';
import { useProviderStore } from '@/lib/provider-store';

interface QuoteFormProps {
  requestId: string;
  /** Appelé avec l'id de la conversation une fois le devis envoyé. */
  onSent: (conversationId: string) => void;
}

/** Formulaire de devis d'un prestataire sur une demande ouverte (RPC send_quote). */
export function QuoteForm({ requestId, onSent }: QuoteFormProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const sendQuote = useProviderStore((s) => s.sendQuote);
  const [amountText, setAmountText] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const submit = async () => {
    const amount = parseAmountInput(amountText);
    if (amount === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setSending(true);
    const conversationId = await sendQuote(requestId, amount, details);
    setSending(false);
    if (conversationId) {
      onSent(conversationId);
    } else {
      Alert.alert(t('providerApp.quoteErrorTitle'), t('providerApp.quoteErrorMessage'));
    }
  };

  return (
    <View>
      <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
        {t('providerApp.quoteSection')}
      </AppText>
      <Card style={styles.card}>
        <TextField
          label={t('providerApp.amountLabel')}
          value={amountText}
          onChangeText={setAmountText}
          placeholder={t('providerApp.amountPlaceholder')}
          keyboardType="decimal-pad"
        />
        {invalid ? (
          <AppText variant="small" color={colors.destructive}>
            {t('providerApp.invalidAmount')}
          </AppText>
        ) : null}
        <TextField
          label={t('providerApp.detailsLabel')}
          value={details}
          onChangeText={setDetails}
          placeholder={t('providerApp.detailsPlaceholder')}
          multiline
          maxLength={2000}
          style={styles.details}
        />
        <Button
          title={t('providerApp.sendQuote')}
          size="lg"
          loading={sending}
          onPress={() => void submit()}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { marginBottom: Spacing.two, marginLeft: Spacing.one },
  card: { gap: Spacing.three },
  details: { minHeight: 96, paddingTop: Spacing.two + 4, textAlignVertical: 'top' },
});
