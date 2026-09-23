import { Database } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useTheme } from '@/hooks/use-theme';
import { isRegistryStale } from '@/lib/rbq';
import type { RbqRegistryStatus } from '@/lib/types';

/** Fraîcheur du registre RBQ : alerte si l'import nocturne n'a pas tourné. */
export function RegistryStatus({ registry }: { registry: RbqRegistryStatus | null }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatDateLong } = useFormats();
  const lastImport = registry?.lastImport ?? null;
  const stale = isRegistryStale(lastImport);

  const message = !lastImport
    ? t('admin.registryNever')
    : stale
      ? t('admin.registryStale', { date: formatDateLong(lastImport) })
      : t('admin.registryFresh', {
          date: formatDateLong(lastImport),
          count: registry?.licenceCount ?? 0,
        });

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Database size={18} color={stale ? colors.warning : colors.primary} />
        <AppText variant="label">{t('admin.registryTitle')}</AppText>
      </View>
      <AppText variant="secondary" color={stale ? colors.warning : colors.textSecondary}>
        {message}
      </AppText>
      <AppText variant="small" color={colors.textSecondary}>
        {t('admin.attribution')}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
