import { Plus, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useTheme } from '@/hooks/use-theme';
import { MAX_QUOTE_LINES, newLine, QUOTE_CATEGORIES, type QuoteDraftLine } from '@/lib/quote-draft';

interface QuoteLinesEditorProps {
  lines: QuoteDraftLine[];
  onChange: (lines: QuoteDraftLine[]) => void;
  total: number;
}

/** Lignes chiffrées du devis (catégorie, description, montant) et total en direct. */
export function QuoteLinesEditor({ lines, onChange, total }: QuoteLinesEditorProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatPrice } = useFormats();

  const update = (key: string, patch: Partial<QuoteDraftLine>) =>
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  return (
    <View style={styles.base}>
      {lines.map((line, index) => (
        <View key={line.key} style={[styles.line, { borderColor: colors.border }]}>
          <View style={styles.lineHeader}>
            <AppText variant="label">{t('quoteForm.lineTitle', { n: index + 1 })}</AppText>
            {lines.length > 1 ? (
              <Pressable
                onPress={() => onChange(lines.filter((l) => l.key !== line.key))}
                hitSlop={10}
                accessibilityLabel={t('quoteForm.removeLine')}>
                <Trash2 size={18} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.categories}>
            {QUOTE_CATEGORIES.map((category) => {
              const selected = line.category === category;
              return (
                <Pressable
                  key={category}
                  onPress={() => update(line.key, { category })}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.category,
                    {
                      backgroundColor: selected ? colors.primaryMuted : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}>
                  <AppText variant="small" color={selected ? colors.primary : colors.text}>
                    {t(`quoteForm.categories.${category}`)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <TextField
            label={t('quoteForm.lineLabel')}
            value={line.label}
            onChangeText={(label) => update(line.key, { label })}
            placeholder={t(`quoteForm.linePlaceholders.${line.category}`)}
            maxLength={80}
          />
          <TextField
            label={t('quoteForm.lineAmount')}
            value={line.amountText}
            onChangeText={(amountText) => update(line.key, { amountText })}
            placeholder="0"
            keyboardType="decimal-pad"
          />
        </View>
      ))}
      {lines.length < MAX_QUOTE_LINES ? (
        <Button
          title={t('quoteForm.addLine')}
          variant="outline"
          icon={<Plus size={18} color={colors.text} />}
          onPress={() => onChange([...lines, newLine('parts')])}
        />
      ) : null}
      <View style={[styles.total, { backgroundColor: colors.primaryMuted }]}>
        <AppText variant="label" color={colors.primary}>
          {t('quoteForm.total')}
        </AppText>
        <AppText variant="heading" color={colors.primary}>
          {formatPrice(total)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.three },
  line: {
    gap: Spacing.two + 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  lineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  category: {
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.one + 2,
  },
  total: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
});
