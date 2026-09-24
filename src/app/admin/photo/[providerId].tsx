import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DecisionPanel } from '@/components/admin/decision-panel';
import { DocumentImage } from '@/components/admin/document-image';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAdminPhotoChange, useAdminStore } from '@/lib/admin-store';

/** Admin : photo proposée par un prestataire, à côté de l'actuelle ; publier ou refuser. */
export default function AdminPhotoScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const change = useAdminPhotoChange(providerId);
  const approvePhoto = useAdminStore((s) => s.approvePhoto);
  const rejectPhoto = useAdminStore((s) => s.rejectPhoto);

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <PageHeader title={change?.providerName ?? t('admin.photosTitle')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {change ? (
          <>
            <Card style={styles.photos}>
              <View style={styles.photo}>
                <DocumentImage label={t('admin.newPhoto')} path={change.photoPath} kind="photo" />
              </View>
              {change.currentPhotoPath ? (
                <View style={styles.photo}>
                  <DocumentImage
                    label={t('admin.currentPhoto')}
                    path={change.currentPhotoPath}
                    kind="photo"
                  />
                </View>
              ) : null}
            </Card>
            <DecisionPanel
              approveLabel={t('admin.approvePhoto')}
              confirmTitle={t('admin.approvePhotoTitle')}
              confirmMessage={t('admin.approvePhotoMessage', { name: change.providerName })}
              rejectPlaceholder={t('admin.rejectPhotoPlaceholder')}
              onApprove={() => approvePhoto(change.providerId)}
              onReject={(reason) => rejectPhoto(change.providerId, reason)}
            />
          </>
        ) : (
          // Traitée (la liste a été rechargée) : plus rien à décider ici.
          <AppText variant="secondary">{t('admin.photoDecided')}</AppText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.five },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  photo: { width: 160 },
});
