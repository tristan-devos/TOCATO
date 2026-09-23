import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { FileCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LocalPhoto } from '@/lib/photo-upload';

interface DocumentPickerProps {
  label: string;
  hint: string;
  photo: LocalPhoto | null;
  /** Une pièce déjà envoyée (renvoi après refus) : on peut la garder. */
  onFile: boolean;
  onPick: (photo: LocalPhoto) => void;
}

/** Choix d'une pièce justificative (photo de la galerie), avec aperçu. */
export function DocumentPicker({ label, hint, photo, onFile, onPick }: DocumentPickerProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    const asset = result.canceled ? undefined : result.assets[0];
    if (asset?.base64) onPick({ uri: asset.uri, base64: asset.base64 });
  };

  const hasDocument = photo !== null || onFile;

  return (
    <Card style={styles.card}>
      <View style={styles.texts}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="small" color={colors.textSecondary}>
          {hint}
        </AppText>
      </View>
      {photo ? (
        <Image source={{ uri: photo.uri }} style={styles.preview} contentFit="cover" />
      ) : onFile ? (
        <View style={styles.onFile}>
          <FileCheck size={18} color={colors.primary} />
          <AppText variant="secondary" color={colors.primary}>
            {t('apply.documentOnFile')}
          </AppText>
        </View>
      ) : null}
      <Button
        title={hasDocument ? t('apply.replacePhoto') : t('apply.choosePhoto')}
        onPress={() => void pick()}
        variant={hasDocument ? 'outline' : 'secondary'}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  texts: { gap: Spacing.half },
  preview: { width: '100%', height: 160, borderRadius: Radius.md },
  onFile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
