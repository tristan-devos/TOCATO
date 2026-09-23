import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StepHeader } from '@/components/apply/step-header';
import { AppText } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ApplicationDraft } from '@/lib/application-draft';
import { SERVICE_IDS } from '@/lib/services';
import type { ServiceId } from '@/lib/types';

interface BusinessStepProps {
  draft: ApplicationDraft;
  onChange: (patch: Partial<ApplicationDraft>) => void;
}

/** Étape 1 : nom de l'entreprise, services, tarif, présentation (la future fiche). */
export function BusinessStep({ draft, onChange }: BusinessStepProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  const toggleService = (id: ServiceId) =>
    onChange({
      services: draft.services.includes(id)
        ? draft.services.filter((s) => s !== id)
        : [...draft.services, id],
    });

  return (
    <View style={styles.base}>
      <StepHeader title={t('apply.businessTitle')} subtitle={t('apply.businessSubtitle')} />
      <TextField
        label={t('apply.businessName')}
        value={draft.businessName}
        onChangeText={(businessName) => onChange({ businessName })}
        placeholder={t('apply.businessNamePlaceholder')}
        autoCapitalize="words"
      />
      <View style={styles.services}>
        <AppText variant="label" color={colors.textSecondary}>
          {t('apply.services')}
        </AppText>
        {SERVICE_IDS.map((id) => (
          <Chip
            key={id}
            label={t(`services.${id}.categoryName`)}
            selected={draft.services.includes(id)}
            onPress={() => toggleService(id)}
          />
        ))}
      </View>
      <TextField
        label={t('apply.hourlyRate')}
        value={draft.hourlyRate}
        onChangeText={(hourlyRate) => onChange({ hourlyRate })}
        placeholder={t('apply.hourlyRatePlaceholder')}
        keyboardType="decimal-pad"
      />
      <TextField
        label={t('apply.bio')}
        value={draft.bio}
        onChangeText={(bio) => onChange({ bio })}
        placeholder={t('apply.bioPlaceholder')}
        multiline
        textAlignVertical="top"
        style={styles.bio}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.three },
  services: { gap: Spacing.two },
  bio: { minHeight: 110, paddingTop: Spacing.two },
});
