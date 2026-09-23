import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApplicationReview } from '@/components/apply/application-review';
import { BusinessStep } from '@/components/apply/business-step';
import { DocumentsStep } from '@/components/apply/documents-step';
import { LegalStep } from '@/components/apply/legal-step';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  draftFrom,
  isBusinessStepValid,
  isDocumentsStepValid,
  isLegalStepValid,
  type ApplicationDraft,
} from '@/lib/application-draft';
import { useApplicationStore } from '@/lib/application-store';
import type { ProviderApplication } from '@/lib/types';

const STEPS = ['business', 'legal', 'documents', 'review'] as const;
type Step = (typeof STEPS)[number];

const STEP_VALID: Record<Step, (draft: ApplicationDraft) => boolean> = {
  business: isBusinessStepValid,
  legal: isLegalStepValid,
  documents: isDocumentsStepValid,
  review: () => true,
};

interface ApplicationFormProps {
  /** Demande refusée à corriger (champs préremplis), ou null pour une première demande. */
  initial: ProviderApplication | null;
}

/** Formulaire d'adhésion en 4 étapes ; l'envoi passe par application-store. */
export function ApplicationForm({ initial }: ApplicationFormProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const submit = useApplicationStore((s) => s.submit);

  const [draft, setDraft] = useState<ApplicationDraft>(() => draftFrom(initial));
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step: Step = STEPS[stepIndex] ?? 'business';
  const onChange = (patch: Partial<ApplicationDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const send = async () => {
    setSubmitting(true);
    setError(null);
    const result = await submit(draft);
    setSubmitting(false);
    // En cas de succès, le store recharge la demande : l'écran passe au statut.
    if (result.error) {
      setError(t(`apply.errors.${result.error}`, { defaultValue: t('apply.errors.generic') }));
    }
  };

  const next = () => {
    if (step === 'review') void send();
    else setStepIndex((i) => i + 1);
  };

  return (
    <View style={styles.base}>
      <ProgressBar progress={(stepIndex + 1) / STEPS.length} />

      {step === 'business' ? <BusinessStep draft={draft} onChange={onChange} /> : null}
      {step === 'legal' ? <LegalStep draft={draft} onChange={onChange} /> : null}
      {step === 'documents' ? <DocumentsStep draft={draft} onChange={onChange} /> : null}
      {step === 'review' ? <ApplicationReview draft={draft} /> : null}

      {error ? (
        <AppText variant="secondary" color={colors.destructive}>
          {error}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        {stepIndex > 0 ? (
          <Button
            title={t('apply.back')}
            onPress={() => setStepIndex((i) => i - 1)}
            variant="outline"
            style={styles.action}
          />
        ) : null}
        <Button
          title={step === 'review' ? t('apply.submit') : t('wizard.next')}
          onPress={next}
          disabled={!STEP_VALID[step](draft)}
          loading={submitting}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.four },
  actions: { flexDirection: 'row', gap: Spacing.two },
  action: { flex: 1 },
});
