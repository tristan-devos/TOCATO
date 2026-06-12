import { Tabs } from 'expo-router';
import { CalendarDays, House, MessageCircle, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { TocatoMark } from '@/components/tocato-mark';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUnreadTotal } from '@/lib/store';

export default function TabsLayout() {
  const colors = useTheme();
  const unread = useUnreadTotal();

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
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Messages',
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
        name="reserver"
        options={{
          title: 'Réserver',
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          // Bouton central surélevé avec le logo TOCATO.
          tabBarButton: (props) => (
            <Pressable
              onPress={props.onPress}
              accessibilityLabel="Réserver une prestation"
              accessibilityRole="button"
              style={styles.centerSlot}>
              <View style={[styles.centerButton, { shadowColor: colors.primary }]}>
                <TocatoMark size={56} backgroundColor={colors.primary} />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Réservations',
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
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
