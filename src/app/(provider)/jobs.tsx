import { useRouter } from 'expo-router';
import { Briefcase } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BookingCard } from '@/components/booking-card';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCounterpartName } from '@/hooks/use-counterpart';
import { isActiveStatus } from '@/lib/booking-status';
import { useAppStore } from '@/lib/store';

type Filter = 'active' | 'history';

/**
 * Missions du prestataire : les réservations où il a été retenu (la RLS ne lui
 * ouvre que celles-là), en cours ou passées.
 */
export default function ProviderJobsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const bookings = useAppStore((s) => s.bookings);
  const conversations = useAppStore((s) => s.conversations);
  const counterpartName = useCounterpartName();
  const [filter, setFilter] = useState<Filter>('active');

  const jobs = useMemo(
    () =>
      bookings
        .filter((b) => (filter === 'active' ? isActiveStatus(b.status) : !isActiveStatus(b.status)))
        .map((booking) => {
          const conversation = conversations.find((c) => c.bookingId === booking.id);
          return { booking, clientName: conversation ? counterpartName(conversation) : '' };
        }),
    [bookings, conversations, counterpartName, filter],
  );

  const options: { id: Filter; label: string }[] = [
    { id: 'active', label: t('providerApp.jobsActive') },
    { id: 'history', label: t('providerApp.jobsHistory') },
  ];

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <AppText variant="title">{t('providerApp.jobsTitle')}</AppText>
        <SegmentedControl options={options} value={filter} onChange={setFilter} />
      </View>
      <FlatList
        data={jobs}
        keyExtractor={(j) => j.booking.id}
        contentContainerStyle={jobs.length === 0 ? styles.emptyContainer : styles.list}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListEmptyComponent={
          <EmptyState
            icon={<Briefcase size={32} color={colors.primary} />}
            title={
              filter === 'active'
                ? t('providerApp.jobsEmptyActiveTitle')
                : t('providerApp.jobsEmptyHistoryTitle')
            }
            message={t('providerApp.jobsEmptyMessage')}
          />
        }
        renderItem={({ item }) => (
          <BookingCard
            booking={item.booking}
            subtitle={
              item.clientName ? t('providerApp.clientLabel', { name: item.clientName }) : undefined
            }
            onPress={() => router.push({ pathname: '/job/[id]', params: { id: item.booking.id } })}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: Spacing.three, gap: Spacing.three },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  gap: { height: Spacing.three },
});
