import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProviderAvatar } from '@/components/provider-avatar';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { loadMyPhotoChange, submitProviderPhoto } from '@/lib/provider-photo';
import type { Provider, ProviderPhotoChange } from '@/lib/types';

/**
 * « Ma photo » du prestataire : la photo publiée, l'état d'une nouvelle photo
 * (en attente ou refusée, avec le motif), et le bouton pour en proposer une. Toute
 * nouvelle photo passe par la validation de l'admin avant d'être publiée.
 */
export function ProviderPhotoCard({ provider }: { provider: Provider }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const [change, setChange] = useState<ProviderPhotoChange | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  // Rechargée à chaque ouverture : la décision de l'admin arrive sans Realtime.
  useFocusEffect(
    useCallback(() => {
      void loadMyPhotoChange().then(setChange);
    }, []),
  );

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset?.base64) return;
    setSending(true);
    setError(false);
    const failure = await submitProviderPhoto({ uri: asset.uri, base64: asset.base64 });
    setSending(false);
    if (failure) {
      setError(true);
      return;
    }
    haptics.success();
    setChange(await loadMyPhotoChange());
  };

  const status =
    change?.status === 'submitted'
      ? { text: t('providerApp.photoPending'), color: colors.warning }
      : change?.status === 'rejected'
        ? {
            text: t('providerApp.photoRejected', { reason: change.rejectionReason ?? '' }),
            color: colors.destructive,
          }
        : provider.photoPath
          ? null
          : { text: t('providerApp.photoMissing'), color: colors.textSecondary };

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <ProviderAvatar name={provider.name} photoPath={provider.photoPath} size={72} />
        <View style={styles.texts}>
          <AppText variant="secondary">{t('providerApp.photoHint')}</AppText>
          {status ? (
            <AppText variant="small" color={status.color}>
              {status.text}
            </AppText>
          ) : null}
        </View>
      </View>
      <Button
        title={provider.photoPath ? t('providerApp.photoChange') : t('providerApp.photoAdd')}
        onPress={() => void pick()}
        variant="outline"
        loading={sending}
      />
      {error ? (
        <AppText variant="small" color={colors.destructive}>
          {t('providerApp.photoError')}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  texts: { flex: 1, gap: Spacing.one },
});
