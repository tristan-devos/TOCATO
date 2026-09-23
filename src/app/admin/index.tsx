import { useFocusEffect, useRouter } from 'expo-router';
import { Inbox } from 'lucide-react-native';
import { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ApplicationRow } from '@/components/admin/application-row';
import { RegistryStatus } from '@/components/admin/registry-status';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAdminApplications, useAdminStore, useRegistryStatus } from '@/lib/admin-store';

/** Admin : demandes d'adhésion (en attente d'abord) et fraîcheur du registre RBQ. */
export default function AdminApplicationsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const applications = useAdminApplications();
  const registry = useRegistryStatus();
  const load = useAdminStore((s) => s.load);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <PageHeader title={t('admin.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <RegistryStatus registry={registry} />
        {applications.length === 0 ? (
          <EmptyState
            icon={<Inbox size={28} color={colors.primary} />}
            title={t('admin.title')}
            message={t('admin.empty')}
          />
        ) : (
          applications.map((application) => (
            <ApplicationRow
              key={application.id}
              application={application}
              onPress={() =>
                router.push({ pathname: '/admin/[id]', params: { id: application.id } })
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.five },
});
