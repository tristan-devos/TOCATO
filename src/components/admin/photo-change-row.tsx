import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProviderAvatar } from '@/components/provider-avatar';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import type { AdminPhotoChange } from '@/lib/types';

interface PhotoChangeRowProps {
  change: AdminPhotoChange;
  onPress: () => void;
}

/** Ligne « Photos à valider » : la photo proposée, le prestataire, la date. */
export function PhotoChangeRow({ change, onPress }: PhotoChangeRowProps) {
  const { t } = useTranslation();
  const { formatDateShort } = useFormats();
  return (
    <Card onPress={onPress} style={styles.card}>
      <ProviderAvatar name={change.providerName} photoPath={change.photoPath} size={48} />
      <View style={styles.texts}>
        <AppText variant="label" numberOfLines={1}>
          {change.providerName}
        </AppText>
        <AppText variant="small">
          {t('admin.photoProposedOn', { date: formatDateShort(change.submittedAt) })}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  texts: { flex: 1, gap: Spacing.half },
});
