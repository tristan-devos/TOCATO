import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { getBookingPhotoUrls } from '@/lib/photo-upload';

interface BookingPhotosProps {
  /** Chemins Storage des photos (bucket privé) — résolus en URLs signées. */
  photos: string[];
}

/**
 * Galerie de vignettes des photos d'une réservation. Le bucket étant privé, les
 * chemins sont convertis en URLs signées à l'affichage (puis oubliées au démontage).
 */
export function BookingPhotos({ photos }: BookingPhotosProps) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void getBookingPhotoUrls(photos).then((resolved) => {
      if (active) setUrls(resolved);
    });
    return () => {
      active = false;
    };
  }, [photos]);

  if (urls.length === 0) return null;

  return (
    <View style={styles.row}>
      {urls.map((url) => (
        <Image key={url} source={{ uri: url }} style={styles.photo} contentFit="cover" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two + 4 },
  photo: { width: 76, height: 76, borderRadius: Radius.sm },
});
