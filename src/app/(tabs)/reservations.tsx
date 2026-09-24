import { useRouter } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BookingCard } from '@/components/booking-card';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { FadeInItem } from '@/components/ui/fade-in-item';
import { Screen } from '@/components/ui/screen';
import { ListSkeleton } from '@/components/ui/skeleton';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDataReady } from '@/lib/auth-store';
import { isActiveStatus } from '@/lib/booking-status';
import { useAppStore } from '@/lib/store';

type Filter = 'active' | 'history';

export default function ReservationsScreen() {
  const colors = useTheme();
  const dataReady = useDataReady();
  const router = useRouter();
  const { t } = useTranslation();
  const bookings = useAppStore((s) => s.bookings);
  const [filter, setFilter] = useState<Filter>('active');

  const filtered = useMemo(
    () =>
      bookings.filter((b) =>
        filter === 'active' ? isActiveStatus(b.status) : !isActiveStatus(b.status),
      ),
    [bookings, filter],
  );

  const tabs: { id: Filter; label: string }[] = [
    { id: 'active', label: t('reservations.filterActive') },
    { id: 'history', label: t('reservations.filterHistory') },
  ];

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <AppText variant="title">{t('reservations.title')}</AppText>

        <SegmentedControl options={tabs} value={filter} onChange={setFilter} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={
          filtered.length === 0 && dataReady ? styles.emptyContainer : styles.listContent
        }
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListEmptyComponent={
          dataReady ? (
            <EmptyState
              icon={<CalendarDays size={32} color={colors.primary} />}
              title={
                filter === 'active'
                  ? t('reservations.emptyActiveTitle')
                  : t('reservations.emptyHistoryTitle')
              }
              message={
                filter === 'active'
                  ? t('reservations.emptyActiveMessage')
                  : t('reservations.emptyHistoryMessage')
              }
              actionLabel={filter === 'active' ? t('common.bookService') : undefined}
              onAction={
                filter === 'active' ? () => router.push('/(tabs)/reserver') : undefined
              }
            />
          ) : (
            <ListSkeleton variant="card" />
          )
        }
        renderItem={({ item, index }) => (
          <FadeInItem index={index}>
            <BookingCard
              booking={item}
              onPress={() =>
                router.push({ pathname: '/reservation/[id]', params: { id: item.id } })
              }
            />
          </FadeInItem>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  gap: { height: Spacing.three },
});
