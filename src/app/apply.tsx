import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApplicationForm } from '@/components/apply/application-form';
import { ApplicationStatus } from '@/components/apply/application-status';
import { LogoutCard } from '@/components/profile/account-actions';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useApplication } from '@/lib/application-store';
import { useProfileStore } from '@/lib/profile-store';

/**
 * Espace du demandeur d'adhésion (rôle 'applicant', seul écran accessible) :
 * formulaire tant que rien n'est envoyé, puis statut de la demande.
 */
export default function ApplyScreen() {
  const { t } = useTranslation();
  const application = useApplication();
  const stayClient = useProfileStore((s) => s.stayClient);
  const [editing, setEditing] = useState(false);

  const showForm = !application || (application.status === 'rejected' && editing);

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">{t('apply.title')}</AppText>
        <AppText variant="secondary">{t('apply.subtitle')}</AppText>
      </View>

      {showForm ? (
        // key : repart d'un brouillon neuf si la demande change (renvoi après refus).
        <ApplicationForm key={application?.id ?? 'new'} initial={application} />
      ) : (
        <ApplicationStatus application={application} onResubmit={() => setEditing(true)} />
      )}

      {!application ? (
        <Button title={t('apply.useAsClient')} onPress={() => void stayClient()} variant="ghost" />
      ) : null}

      <LogoutCard />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two },
});
