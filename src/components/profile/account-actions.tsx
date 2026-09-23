import { Globe, LogOut } from 'lucide-react-native';
import { Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/card';
import { ListItem } from '@/components/ui/list-item';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { changeLanguage } from '@/i18n';
import { useAuthStore } from '@/lib/auth-store';

/** Élément de menu « Langue » (FR/EN), à placer dans une carte de menu. */
export function LanguageItem() {
  const colors = useTheme();
  const { t, i18n } = useTranslation();
  const langLabel = i18n.language === 'en' ? t('profile.languageEn') : t('profile.languageFr');

  const pickLanguage = () => {
    Alert.alert(t('profile.language'), undefined, [
      { text: t('profile.languageFr'), onPress: () => void changeLanguage('fr') },
      { text: t('profile.languageEn'), onPress: () => void changeLanguage('en') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <ListItem
      title={t('profile.language')}
      subtitle={langLabel}
      leading={<Globe size={20} color={colors.primary} />}
      onPress={pickLanguage}
    />
  );
}

/** Carte « Se déconnecter », avec confirmation. Partagée par les profils client et prestataire. */
export function LogoutCard() {
  const colors = useTheme();
  const { t } = useTranslation();
  const signOut = useAuthStore((s) => s.signOut);

  const confirmLogout = () => {
    Alert.alert(t('profile.logoutTitle'), t('profile.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        // La garde de navigation redirige vers la connexion une fois la session levée.
        onPress: () => void signOut(),
      },
    ]);
  };

  return (
    <Card style={styles.menuCard}>
      <ListItem
        title={t('profile.logout')}
        leading={<LogOut size={20} color={colors.destructive} />}
        onPress={confirmLogout}
        destructive
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  menuCard: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.two },
});
