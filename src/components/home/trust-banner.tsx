import { ShieldCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Ce que TOCATO vérifie vraiment chez chaque prestataire (docs/adhesion-prestataires.md) :
 * la confiance repose sur des faits, pas sur un slogan.
 */
export function TrustBanner() {
  const colors = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.base, { backgroundColor: colors.primaryMuted }]}>
      <View style={[styles.icon, { backgroundColor: colors.primary }]}>
        <ShieldCheck size={22} color={colors.onPrimary} />
      </View>
      <View style={styles.texts}>
        <AppText variant="label" color={colors.primary}>
          {t('home.trustTitle')}
        </AppText>
        <AppText variant="small" color={colors.primary}>
          {t('home.trustDetail')}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: Spacing.half },
});
