import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

interface TocatoMarkProps {
  size?: number;
}

const LOGO = require('@/assets/images/tocato-logo.png');

/**
 * Le logo TOCATO : la silhouette verte de marque sur disque, fond transparent.
 * Sert de logo dans le bouton central de la barre d'onglets et les en-têtes.
 */
export function TocatoMark({ size = 56 }: TocatoMarkProps) {
  return (
    <Image
      source={LOGO}
      style={[styles.logo, { width: size, height: size }]}
      contentFit="contain"
      accessible={false}
    />
  );
}

const styles = StyleSheet.create({
  logo: { backgroundColor: 'transparent' },
});
