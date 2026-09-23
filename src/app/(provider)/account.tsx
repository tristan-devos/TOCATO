import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LanguageItem, LogoutCard } from '@/components/profile/account-actions';
import { ServiceIcon } from '@/components/service-icon';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import { useMyProviderId, useProfile } from '@/lib/profile-store';
import { useProvider } from '@/lib/providers-store';

/**
 * Profil du prestataire : sa fiche (lecture seule en v1, modifiée par l'équipe
 * TOCATO), la langue et la déconnexion.
 */
export default function ProviderProfileTab() {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatPrice } = useFormats();
  const profile = useProfile();
  const provider = useProvider(useMyProviderId() ?? undefined);

  return (
    <Screen>
      <AppText variant="title">{t('providerApp.profileTitle')}</AppText>

      <Card style={styles.userCard}>
        <Avatar name={provider?.name ?? profile?.name ?? ''} size={64} />
        <View style={styles.userTexts}>
          <AppText variant="subheading">{provider?.name ?? profile?.name ?? ''}</AppText>
          <AppText variant="secondary">{profile?.email ?? ''}</AppText>
          <View style={styles.badge}>
            <Badge label={t('providerApp.providerBadge')} tone="primary" />
          </View>
        </View>
      </Card>

      {provider ? (
        <View>
          <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
            {t('providerApp.servicesSection')}
          </AppText>
          <Card style={styles.infoCard}>
            {provider.services.map((serviceId) => (
              <View key={serviceId} style={styles.serviceRow}>
                <ServiceIcon serviceId={serviceId} boxed size={18} boxSize={36} />
                <AppText variant="label">{t(`services.${serviceId}.categoryName`)}</AppText>
              </View>
            ))}
            <AppText variant="secondary">
              {t('providerApp.hourlyRate', { price: formatPrice(provider.hourlyRate) })}
            </AppText>
            {provider.bio ? <AppText variant="secondary">{provider.bio}</AppText> : null}
            <AppText variant="small" color={colors.textSecondary}>
              {t('providerApp.editNote')}
            </AppText>
          </Card>
        </View>
      ) : null}

      <View>
        <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
          {t('providerApp.settingsSection')}
        </AppText>
        <Card style={styles.menuCard}>
          <LanguageItem />
        </Card>
      </View>

      <LogoutCard />
    </Screen>
  );
}

const styles = StyleSheet.create({
  userCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  userTexts: { flex: 1, gap: 2 },
  badge: { flexDirection: 'row', marginTop: Spacing.one },
  sectionLabel: { marginBottom: Spacing.two, marginLeft: Spacing.one },
  infoCard: { gap: Spacing.two + 4 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 4 },
  menuCard: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.two },
});
