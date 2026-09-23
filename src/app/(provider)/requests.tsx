import { useFocusEffect, useRouter } from 'expo-router';
import { Inbox } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { RequestCard } from '@/components/provider/request-card';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOpenRequests, useProviderStore } from '@/lib/provider-store';

/**
 * Demandes ouvertes dans les services du prestataire. Pas de temps réel sur ces
 * demandes (voir provider-store) : rechargées au focus et par « tirer pour rafraîchir ».
 */
export default function ProviderRequestsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const requests = useOpenRequests();
  const refreshOpenRequests = useProviderStore((s) => s.refreshOpenRequests);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshOpenRequests();
    }, [refreshOpenRequests]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOpenRequests();
    setRefreshing(false);
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <AppText variant="title">{t('providerApp.requestsTitle')}</AppText>
        <AppText variant="secondary">{t('providerApp.requestsSubtitle')}</AppText>
      </View>
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        contentContainerStyle={requests.length === 0 ? styles.emptyContainer : styles.list}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Inbox size={32} color={colors.primary} />}
            title={t('providerApp.requestsEmptyTitle')}
            message={t('providerApp.requestsEmptyMessage')}
          />
        }
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onPress={() => router.push({ pathname: '/request/[id]', params: { id: item.id } })}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: Spacing.three, gap: Spacing.one },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  gap: { height: Spacing.three },
});
