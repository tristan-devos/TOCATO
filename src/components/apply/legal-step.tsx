import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StepHeader } from '@/components/apply/step-header';
import { AppText } from '@/components/ui/app-text';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { needsRbqLicence, type ApplicationDraft } from '@/lib/application-draft';

interface LegalStepProps {
  draft: ApplicationDraft;
  onChange: (patch: Partial<ApplicationDraft>) => void;
}

/** Étape 2 : NEQ, et licence RBQ si la plomberie est cochée. */
export function LegalStep({ draft, onChange }: LegalStepProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.base}>
      <StepHeader title={t('apply.legalTitle')} subtitle={t('apply.legalSubtitle')} />
      <View style={styles.field}>
        <TextField
          label={t('apply.neq')}
          value={draft.neq}
          onChangeText={(neq) => onChange({ neq })}
          placeholder={t('apply.neqPlaceholder')}
          keyboardType="number-pad"
          maxLength={12}
        />
        <AppText variant="small" color={colors.textSecondary}>
          {t('apply.neqHint')}
        </AppText>
      </View>
      {needsRbqLicence(draft.services) ? (
        <View style={styles.field}>
          <TextField
            label={t('apply.rbqLicence')}
            value={draft.rbqLicence}
            onChangeText={(rbqLicence) => onChange({ rbqLicence })}
            placeholder={t('apply.rbqPlaceholder')}
            keyboardType="numbers-and-punctuation"
            maxLength={14}
          />
          <AppText variant="small" color={colors.textSecondary}>
            {t('apply.rbqHint')}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.three },
  field: { gap: Spacing.one },
});
