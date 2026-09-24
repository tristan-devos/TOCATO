import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ToolboxIllustration } from '@/components/illustrations/toolbox-illustration';
import { MissionCalendar } from '@/components/provider/mission-calendar';
import { MissionList } from '@/components/provider/mission-list';
import { NextMissionCard } from '@/components/provider/next-mission-card';
import { StatTiles } from '@/components/provider/stat-tiles';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { useFormats } from '@/hooks/use-formats';
import { useMissionWhen } from '@/hooks/use-mission-when';
import { useProviderDashboard } from '@/hooks/use-provider-dashboard';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/lib/calendar';
import { useProfile } from '@/lib/profile-store';
import { greetingPeriod } from '@/lib/provider-dashboard';
import { useAppStore } from '@/lib/store';

/**
 * Accueil du prestataire (docs/experience-emotionnelle.md §6) : prochaine mission,
 * chiffres clés, calendrier et missions du jour choisi, missions à planifier.
 */
export default function ProviderHomeScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { formatPrice, formatDateLong } = useFormats();
  const missionWhen = useMissionWhen();
  const profile = useProfile();
  const loadAll = useAppStore((s) => s.loadAll);
  // Rafraîchi à chaque ouverture : « aujourd'hui » et « ce mois-ci » restent justes.
  const [now, setNow] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState(() => toDateKey(now));
  const [refreshing, setRefreshing] = useState(false);
  const dashboard = useProviderDashboard(now);

  useFocusEffect(useCallback(() => setNow(new Date()), []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setNow(new Date());
    setRefreshing(false);
  };

  const openMission = (id: string) => router.push({ pathname: '/job/[id]', params: { id } });
  const todayKey = toDateKey(now);
  const firstName = (profile?.name ?? '').split(' ')[0] ?? '';
  const dayMissions = dashboard.missionsByDay.get(selectedKey) ?? [];
  const next = dashboard.nextMission;

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={colors.primary}
        />
      }>
      <View>
        <AppText variant="display">
          {t(
            greetingPeriod(now) === 'morning'
              ? 'providerHome.greetingMorning'
              : 'providerHome.greetingEvening',
            { name: firstName },
          )}
        </AppText>
        <AppText variant="secondary">{formatDateLong(todayKey)}</AppText>
      </View>

      <NextMissionCard
        mission={next}
        clientName={next ? dashboard.clientNameFor(next) : ''}
        onOpen={openMission}
        onSeeRequests={() => router.push('/(provider)/requests')}
      />

      {dashboard.isNewProvider ? (
        <EmptyState
          illustration={<ToolboxIllustration />}
          title={t('providerHome.newTitle')}
          message={t('providerHome.newMessage')}
        />
      ) : (
        <>
          <StatTiles
            tiles={[
              {
                value: String(dashboard.upcomingCount),
                label: t('providerHome.statUpcoming'),
                onPress: () => router.push('/(provider)/jobs'),
              },
              {
                value: String(dashboard.pendingQuoteCount),
                label: t('providerHome.statPendingQuotes'),
                onPress: () => router.push('/(provider)/messages'),
              },
              {
                value: formatPrice(dashboard.completedThisMonth),
                label: t('providerHome.statCompletedMonth'),
                onPress: () => router.push('/(provider)/jobs'),
              },
            ]}
          />

          <MissionCalendar
            selectedKey={selectedKey}
            todayKey={todayKey}
            countFor={(key) => dashboard.missionsByDay.get(key)?.length ?? 0}
            onSelect={setSelectedKey}
          />

          <MissionList
            title={`${formatDateLong(selectedKey)} · ${t('providerHome.dayMissions', {
              count: dayMissions.length,
            })}`}
            emptyText={t('providerHome.dayEmpty')}
            missions={dayMissions}
            detailFor={(mission) =>
              mission.timeSlot ? t(`timeSlots.${mission.timeSlot}`) : missionWhen(mission)
            }
            clientNameFor={dashboard.clientNameFor}
            onOpen={openMission}
          />

          {dashboard.unscheduled.length > 0 ? (
            <MissionList
              title={t('providerHome.unscheduledTitle', { count: dashboard.unscheduled.length })}
              hint={t('providerHome.unscheduledHint')}
              missions={dashboard.unscheduled}
              detailFor={missionWhen}
              clientNameFor={dashboard.clientNameFor}
              onOpen={openMission}
            />
          ) : null}
        </>
      )}
    </Screen>
  );
}
