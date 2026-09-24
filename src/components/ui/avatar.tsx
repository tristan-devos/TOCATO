import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Font } from '@/constants/theme';

/** Palette de fonds d'avatar : choisie par hachage du nom pour rester stable. */
const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#0D9488', '#D97706', '#DB2777', '#475569'];

interface AvatarProps {
  name: string;
  size?: number;
  /** Photo (URL signée) : initiales tant qu'elle manque ou si elle ne charge pas. */
  uri?: string | null;
  /** Clé de cache stable de la photo (son chemin Storage : l'URL signée change). */
  cacheKey?: string;
}

export function Avatar({ name, size = 44, uri, cacheKey }: AvatarProps) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (uri && uri !== failedUri) {
    return (
      <Image
        source={{ uri, cacheKey }}
        style={shape}
        contentFit="cover"
        transition={150}
        accessibilityLabel={name}
        onError={() => setFailedUri(uri)}
      />
    );
  }

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const backgroundColor = AVATAR_COLORS[hash % AVATAR_COLORS.length];

  return (
    <View style={[styles.base, shape, { backgroundColor }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  initials: { ...Font.bold, color: '#FFFFFF' },
});
