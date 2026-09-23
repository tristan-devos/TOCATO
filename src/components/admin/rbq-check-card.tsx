import { ExternalLink } from 'lucide-react-native';
import { Linking, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useTheme } from '@/hooks/use-theme';
import { formatRbqLicence } from '@/lib/application-draft';
import { rbqVerifyUrl } from '@/lib/rbq';
import type { ProviderApplication } from '@/lib/types';

/** Résultat de la vérification RBQ faite à l'envoi (indicatif : l'admin décide). */
export function RbqCheckCard({ application }: { application: ProviderApplication }) {
  const colors = useTheme();
  const { t, i18n } = useTranslation();
  const { formatDateLong } = useFormats();
  const check = application.rbqCheck;

  return (
    <Card style={styles.card}>
      <AppText variant="label">{t('admin.rbqTitle')}</AppText>
      {application.rbqLicence && check ? (
        <>
          <View style={styles.row}>
            <AppText variant="body" style={styles.licence}>
              {formatRbqLicence(application.rbqLicence)}
            </AppText>
            <Badge
              label={t(`admin.rbq.${check.result}`)}
              tone={check.result === 'ok' ? 'success' : 'warning'}
            />
          </View>
          {check.registryName ? (
            <AppText variant="secondary">
              {t('admin.rbqRegistryName', { name: check.registryName })}
            </AppText>
          ) : null}
          <AppText variant="small" color={colors.textSecondary}>
            {t('admin.rbqCheckedOn', { date: formatDateLong(check.checkedAt) })}
          </AppText>
          <Button
            title={t('admin.rbqVerifyOnline')}
            onPress={() => void Linking.openURL(rbqVerifyUrl(i18n.language))}
            variant="outline"
            icon={<ExternalLink size={16} color={colors.text} />}
          />
        </>
      ) : (
        <AppText variant="secondary">{t('admin.rbqNone')}</AppText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  licence: { flex: 1 },
});
