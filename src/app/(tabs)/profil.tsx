import { useRouter } from 'expo-router';
import {
  CircleHelp,
  CreditCard,
  Globe,
  LogOut,
  MapPin,
  RotateCcw,
} from 'lucide-react-native';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ListItem } from '@/components/ui/list-item';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/lib/auth-store';
import { changeLanguage } from '@/i18n';
import { useAppStore } from '@/lib/store';

export default function ProfilScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const user = useAppStore((s) => s.user);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const signOut = useAuthStore((s) => s.signOut);
  const currentLang = i18n.language as 'fr' | 'en';

  const confirmReset = () => {
    Alert.alert(t('profile.resetTitle'), t('profile.resetMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.resetConfirm'), style: 'destructive', onPress: resetDemo },
    ]);
  };

  const confirmLogout = () => {
    Alert.alert(t('profile.logoutTitle'), t('profile.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: () => {
          // La garde de navigation redirige vers la connexion une fois la session levée.
          void signOut();
        },
      },
    ]);
  };

  const pickLanguage = () => {
    Alert.alert(t('profile.language'), undefined, [
      {
        text: t('profile.languageFr'),
        onPress: () => {
          void changeLanguage('fr');
        },
      },
      {
        text: t('profile.languageEn'),
        onPress: () => {
          void changeLanguage('en');
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const langLabel = currentLang === 'fr' ? t('profile.languageFr') : t('profile.languageEn');

  return (
    <Screen>
      <AppText variant="title">{t('profile.title')}</AppText>

      <Card style={styles.userCard}>
        <Avatar name={user.name} size={64} />
        <View style={styles.userTexts}>
          <AppText variant="subheading">{user.name}</AppText>
          <AppText variant="secondary">{user.email}</AppText>
          <AppText variant="secondary">{user.phone}</AppText>
        </View>
      </Card>

      <View>
        <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
          {t('profile.accountSection')}
        </AppText>
        <Card style={styles.menuCard}>
          <ListItem
            title={t('profile.addresses')}
            subtitle={t('profile.addressCount', { count: user.addresses.length })}
            leading={<MapPin size={20} color={colors.primary} />}
            onPress={() => router.push('/profile/addresses')}
          />
          <ListItem
            title={t('profile.payment')}
            subtitle={t('profile.paymentSubtitle')}
            leading={<CreditCard size={20} color={colors.primary} />}
            onPress={() => router.push('/profile/payments')}
          />
        </Card>
      </View>

      <View>
        <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
          {t('profile.supportSection')}
        </AppText>
        <Card style={styles.menuCard}>
          <ListItem
            title={t('profile.help')}
            leading={<CircleHelp size={20} color={colors.primary} />}
            onPress={() => router.push('/profile/help')}
          />
          <ListItem
            title={t('profile.language')}
            subtitle={langLabel}
            leading={<Globe size={20} color={colors.primary} />}
            onPress={pickLanguage}
          />
          <ListItem
            title={t('profile.resetDemo')}
            subtitle={t('profile.resetDemoSubtitle')}
            leading={<RotateCcw size={20} color={colors.primary} />}
            onPress={confirmReset}
          />
        </Card>
      </View>

      <Card style={styles.menuCard}>
        <ListItem
          title={t('profile.logout')}
          leading={<LogOut size={20} color={colors.destructive} />}
          onPress={confirmLogout}
          destructive
        />
      </Card>

      <AppText variant="small" style={styles.version} color={colors.textSecondary}>
        {t('profile.version')}
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
