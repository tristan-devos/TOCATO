import { useRouter } from 'expo-router';
import {
  CircleHelp,
  CreditCard,
  LogOut,
  MapPin,
  RotateCcw,
} from 'lucide-react-native';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ListItem } from '@/components/ui/list-item';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/lib/store';

export default function ProfilScreen() {
  const colors = useTheme();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const resetDemo = useAppStore((s) => s.resetDemo);

  const confirmReset = () => {
    Alert.alert(
      'Réinitialiser la démo',
      'Toutes vos réservations et conversations seront remplacées par les données de départ.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réinitialiser', style: 'destructive', onPress: resetDemo },
      ],
    );
  };

  const mockLogout = () => {
    Alert.alert('Déconnexion', 'La connexion par compte arrivera avec le backend.');
  };

  return (
    <Screen>
      <AppText variant="title">Profil</AppText>

      {/* Carte utilisateur */}
      <Card style={styles.userCard}>
        <Avatar name={user.name} size={64} />
        <View style={styles.userTexts}>
          <AppText variant="subheading">{user.name}</AppText>
          <AppText variant="secondary">{user.email}</AppText>
          <AppText variant="secondary">{user.phone}</AppText>
        </View>
      </Card>

      {/* Mon compte */}
      <View>
        <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
          MON COMPTE
        </AppText>
        <Card style={styles.menuCard}>
          <ListItem
            title="Mes adresses"
            subtitle={`${user.addresses.length} adresse${user.addresses.length > 1 ? 's' : ''} enregistrée${user.addresses.length > 1 ? 's' : ''}`}
            leading={<MapPin size={20} color={colors.primary} />}
            onPress={() => router.push('/profile/addresses')}
          />
          <ListItem
            title="Paiement"
            subtitle="Cartes et moyens de paiement"
            leading={<CreditCard size={20} color={colors.primary} />}
            onPress={() => router.push('/profile/payments')}
          />
        </Card>
      </View>

      {/* Support */}
      <View>
        <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
          SUPPORT
        </AppText>
        <Card style={styles.menuCard}>
          <ListItem
            title="Aide et questions fréquentes"
            leading={<CircleHelp size={20} color={colors.primary} />}
            onPress={() => router.push('/profile/help')}
          />
          <ListItem
            title="Réinitialiser la démo"
            subtitle="Restaurer les données d'exemple"
            leading={<RotateCcw size={20} color={colors.primary} />}
            onPress={confirmReset}
          />
        </Card>
      </View>

      <Card style={styles.menuCard}>
        <ListItem
          title="Se déconnecter"
          leading={<LogOut size={20} color={colors.destructive} />}
          onPress={mockLogout}
          destructive
        />
      </Card>

      <AppText variant="small" style={styles.version} color={colors.textSecondary}>
        TOCATO v1.0.0 · Montréal
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  userCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  userTexts: { flex: 1, gap: 2 },
  sectionLabel: { marginBottom: Spacing.two, marginLeft: Spacing.one },
  menuCard: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.two },
  version: { textAlign: 'center' },
});
