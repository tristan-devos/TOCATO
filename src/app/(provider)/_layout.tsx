import { Tabs } from 'expo-router';
import { Briefcase, Inbox, MessageCircle, UserRound } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Font, FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUnreadTotal } from '@/lib/store';

/** Onglets de l'interface prestataire (compte relié à une fiche `providers`). */
export default function ProviderTabsLayout() {
  const colors = useTheme();
  const unread = useUnreadTotal();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, ...Font.semibold },
      }}>
      <Tabs.Screen
        name="requests"
        options={{
          title: t('providerApp.tabRequests'),
          tabBarIcon: ({ color, size }) => <Inbox color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: t('providerApp.tabJobs'),
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.destructive,
            color: '#FFFFFF',
            ...Font.regular,
            fontSize: FontSize.xs,
          },
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
