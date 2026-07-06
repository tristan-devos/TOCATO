import { Tabs } from 'expo-router';
import { CalendarDays, House, MessageCircle, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TocatoMark } from '@/components/tocato-mark';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUnreadTotal } from '@/lib/store';

export default function TabsLayout() {
  const colors = useTheme();
  const unread = useUnreadTotal();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: t('tabs.reservations'),
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reserver"
        options={{
          title: t('tabs.book'),
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <Pressable
              onPress={props.onPress}
              accessibilityLabel={t('tabs.bookA11yLabel')}
              accessibilityRole="button"
              style={styles.centerSlot}>
              <View style={[styles.centerButton, { shadowColor: colors.primary }]}>
                <TocatoMark size={56} />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: t('tabs.messages'),
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.destructive,
            color: '#FFFFFF',
            fontSize: FontSize.xs,
          },
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    marginTop: -28,
    borderRadius: 32,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
