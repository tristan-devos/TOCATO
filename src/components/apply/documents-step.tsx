import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DocumentPicker } from '@/components/apply/document-picker';
import { StepHeader } from '@/components/apply/step-header';
import { Spacing } from '@/constants/theme';
import type { ApplicationDraft } from '@/lib/application-draft';

interface DocumentsStepProps {
  draft: ApplicationDraft;
  onChange: (patch: Partial<ApplicationDraft>) => void;
}

/** Étape 3 : pièce d'identité et certificat d'assurance (bucket privé). */
export function DocumentsStep({ draft, onChange }: DocumentsStepProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.base}>
      <StepHeader title={t('apply.documentsTitle')} subtitle={t('apply.documentsSubtitle')} />
      <DocumentPicker
        label={t('apply.idDocument')}
        hint={t('apply.idDocumentHint')}
        photo={draft.idDocument}
        onFile={draft.idDocumentPath !== null}
        onPick={(idDocument) => onChange({ idDocument })}
      />
      <DocumentPicker
        label={t('apply.insurance')}
        hint={t('apply.insuranceHint')}
        photo={draft.insurance}
        onFile={draft.insurancePath !== null}
        onPick={(insurance) => onChange({ insurance })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.three },
});
