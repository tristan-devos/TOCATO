import { useRouter } from 'expo-router';
import { Briefcase, CircleHelp, CreditCard, MapPin, ShieldCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LanguageItem, LogoutCard } from '@/components/profile/account-actions';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ListItem } from '@/components/ui/list-item';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAddresses, useIsAdmin, useProfile, useProfileStore } from '@/lib/profile-store';
import { useAppStore } from '@/lib/store';

export default function ProfilScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const profile = useProfile();
  const addresses = useAddresses();
  const bookings = useAppStore((s) => s.bookings);
  const becomeApplicant = useProfileStore((s) => s.becomeApplicant);
  const isAdmin = useIsAdmin();

  return (
    <Screen>
      <AppText variant="title">{t('profile.title')}</AppText>

      <Card style={styles.userCard}>
        <Avatar name={profile?.name ?? ''} size={64} />
        <View style={styles.userTexts}>
          <AppText variant="subheading">{profile?.name ?? ''}</AppText>
          <AppText variant="secondary">{profile?.email ?? ''}</AppText>
          {profile?.phone ? <AppText variant="secondary">{profile.phone}</AppText> : null}
        </View>
      </Card>

      <View>
        <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
          {t('profile.accountSection')}
        </AppText>
        <Card style={styles.menuCard}>
          <ListItem
            title={t('profile.addresses')}
            subtitle={t('profile.addressCount', { count: addresses.length })}
            leading={<MapPin size={20} color={colors.primary} />}
            onPress={() => router.push('/profile/addresses')}
          />
          <ListItem
            title={t('profile.payment')}
            subtitle={t('profile.paymentSubtitle')}
            leading={<CreditCard size={20} color={colors.primary} />}
            onPress={() => router.push('/profile/payments')}
          />
          {isAdmin ? (
            <ListItem
              title={t('admin.menuTitle')}
              subtitle={t('admin.menuSubtitle')}
              leading={<ShieldCheck size={20} color={colors.primary} />}
              onPress={() => router.push('/admin')}
            />
          ) : null}
          {/* Un compte avec des réservations reste client (règle v1, refusé côté serveur). */}
          {bookings.length === 0 ? (
            <ListItem
              title={t('profile.becomeProvider')}
              subtitle={t('profile.becomeProviderSubtitle')}
              leading={<Briefcase size={20} color={colors.primary} />}
              onPress={() => void becomeApplicant()}
            />
          ) : null}
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
          <LanguageItem />
        </Card>
      </View>

      <LogoutCard />

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
