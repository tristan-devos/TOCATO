import { useRouter } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BookingCard } from '@/components/booking-card';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isActiveStatus } from '@/lib/booking-status';
import { useAppStore } from '@/lib/store';

type Filter = 'active' | 'history';

export default function ReservationsScreen() {
  const colors = useTheme();
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

        <View style={[styles.segmented, { backgroundColor: colors.backgroundElement }]}>
          {tabs.map((tab) => {
            const selected = filter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setFilter(tab.id)}
                style={[styles.segment, selected && { backgroundColor: colors.card }]}>
                <Text
                  style={[
                    styles.segmentLabel,
                    { color: selected ? colors.text : colors.textSecondary },
                  ]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListEmptyComponent={
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
        }
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onPress={() =>
              router.push({ pathname: '/reservation/[id]', params: { id: item.id } })
            }
          />
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
  segmented: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.md - 3,
  },
  segmentLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  gap: { height: Spacing.three },
});
