import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Font, FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LocalPhoto } from '@/lib/photo-upload';

const MAX_PHOTOS = 4;

interface DetailsStepProps {
  description: string;
  onDescriptionChange: (text: string) => void;
  photos: LocalPhoto[];
  onPhotosChange: (photos: LocalPhoto[]) => void;
}

export function DetailsStep({
  description,
  onDescriptionChange,
  photos,
  onPhotosChange,
}: DetailsStepProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      const picked: LocalPhoto[] = result.assets
        .filter((asset) => asset.base64)
        .map((asset) => ({ uri: asset.uri, base64: asset.base64 ?? '' }));
      onPhotosChange([...photos, ...picked].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (uri: string) =>
    onPhotosChange(photos.filter((photo) => photo.uri !== uri));

  return (
    <View style={styles.base}>
      <View style={styles.titles}>
        <AppText variant="heading">{t('wizard.detailsTitle')}</AppText>
        <AppText variant="secondary">{t('wizard.detailsSubtitle')}</AppText>
      </View>

      <TextInput
        value={description}
        onChangeText={onDescriptionChange}
        placeholder={t('wizard.detailsPlaceholder')}
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlignVertical="top"
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
        ]}
      />

      <View style={styles.photosRow}>
        {photos.map((photo) => (
          <View key={photo.uri} style={styles.photoBox}>
            <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
            <Pressable
              onPress={() => removePhoto(photo.uri)}
              hitSlop={8}
              style={[styles.removePhoto, { backgroundColor: colors.text }]}>
              <X size={12} color={colors.card} />
            </Pressable>
          </View>
        ))}
        {photos.length < MAX_PHOTOS ? (
          <Pressable
            onPress={pickPhotos}
            style={({ pressed }) => [
              styles.addPhoto,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <ImagePlus size={22} color={colors.primary} />
            <AppText variant="small" color={colors.textSecondary}>
              {t('wizard.photos')}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.four },
  titles: { gap: Spacing.two },
  input: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    minHeight: 140,
    ...Font.regular,
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two + 4 },
  photoBox: { position: 'relative' },
  photo: { width: 76, height: 76, borderRadius: Radius.sm },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: {
    width: 76,
    height: 76,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
