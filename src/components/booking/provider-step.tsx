import { Sparkles } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProviderRow } from '@/components/provider-row';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import { providersForService } from '@/lib/mock-data';
import type { Provider, ServiceId } from '@/lib/types';

interface ProviderStepProps {
  serviceId: ServiceId;
  /** null = laisser TOCATO choisir (attribution automatique). */
  selectedId: string | null;
  onSelect: (providerId: string | null) => void;
}

/** Étape du wizard : le client choisit un prestataire, ou laisse TOCATO décider. */
export function ProviderStep({ serviceId, selectedId, onSelect }: ProviderStepProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const providers = providersForService(serviceId);

  const selectedStyle = {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryMuted,
  };

  return (
    <View style={styles.base}>
      <View style={styles.titles}>
        <AppText variant="heading">{t('wizard.providerTitle')}</AppText>
        <AppText variant="secondary">{t('wizard.providerSubtitle')}</AppText>
      </View>

      <Card onPress={() => onSelect(null)} style={selectedId === null ? selectedStyle : undefined}>
        <View style={styles.autoRow}>
          <Sparkles size={22} color={colors.primary} />
          <View style={styles.autoTexts}>
            <AppText variant="label">{t('wizard.providerAuto')}</AppText>
            <AppText variant="secondary">{t('wizard.providerAutoHint')}</AppText>
          </View>
        </View>
      </Card>

      {providers.map((provider) => (
        <Card
          key={provider.id}
          onPress={() => onSelect(provider.id)}
          style={selectedId === provider.id ? selectedStyle : undefined}>
          <ProviderCardBody provider={provider} />
        </Card>
      ))}
    </View>
  );
}

function ProviderCardBody({ provider }: { provider: Provider }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatPrice } = useFormats();

  return (
    <View style={styles.body}>
      <ProviderRow provider={provider} />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.metaRow}>
        <AppText variant="label" color={colors.primary}>
          {t('wizard.providerHourlyRate', { price: formatPrice(provider.hourlyRate) })}
        </AppText>
        <AppText variant="secondary">
          {t('wizard.providerJobs', { count: provider.jobsCompleted })}
        </AppText>
      </View>
      <AppText variant="secondary" numberOfLines={2}>
        {provider.bio}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.two + 4 },
  titles: { gap: Spacing.two, marginBottom: Spacing.one },
  autoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  autoTexts: { flex: 1, gap: 2 },
  body: { gap: Spacing.two + 2 },
  divider: { height: StyleSheet.hairlineWidth },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
