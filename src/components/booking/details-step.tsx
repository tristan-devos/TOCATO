import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MAX_PHOTOS = 4;

interface DetailsStepProps {
  description: string;
  onDescriptionChange: (text: string) => void;
  photos: string[];
  onPhotosChange: (uris: string[]) => void;
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
    });
    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      onPhotosChange([...photos, ...uris].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (uri: string) => onPhotosChange(photos.filter((p) => p !== uri));

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
        {photos.map((uri) => (
          <View key={uri} style={styles.photoBox}>
            <Image source={{ uri }} style={styles.photo} contentFit="cover" />
            <Pressable
              onPress={() => removePhoto(uri)}
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
