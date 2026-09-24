import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getProviderDocumentUrl } from '@/lib/document-upload';
import { getProviderPhotoUrl } from '@/lib/provider-photo';

interface DocumentImageProps {
  label: string;
  path: string;
  /** Bucket : pièce justificative (défaut) ou photo de profil (aperçu carré). */
  kind?: 'document' | 'photo';
}

/** Pièce justificative ou photo (URL signée, bucket privé) ; toucher l'ouvre en grand. */
export function DocumentImage({ label, path, kind = 'document' }: DocumentImageProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const resolve = kind === 'photo' ? getProviderPhotoUrl : getProviderDocumentUrl;
    void resolve(path).then((signed) => {
      if (!active) return;
      setUrl(signed);
      setFailed(signed === null);
    });
    return () => {
      active = false;
    };
  }, [path, kind]);

  return (
    <View style={styles.base}>
      <AppText variant="small" color={colors.textSecondary}>
        {label}
      </AppText>
      {url ? (
        <Pressable onPress={() => void Linking.openURL(url)}>
          <Image
            source={{ uri: url }}
            style={kind === 'photo' ? styles.photo : styles.image}
            contentFit="cover"
          />
        </Pressable>
      ) : (
        <View style={[styles.image, styles.empty, { backgroundColor: colors.backgroundElement }]}>
          {failed ? (
            <AppText variant="small" color={colors.textSecondary}>
              {t('admin.documentUnavailable')}
            </AppText>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.one },
  image: { width: '100%', height: 180, borderRadius: Radius.md },
  photo: { width: 160, height: 160, borderRadius: Radius.md },
  empty: { alignItems: 'center', justifyContent: 'center' },
});
