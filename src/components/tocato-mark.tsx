import { StyleSheet, Text, View } from 'react-native';

interface TocatoMarkProps {
  size?: number;
  /** Couleur du disque — par défaut le bleu TOCATO */
  backgroundColor?: string;
}

/**
 * Le monogramme TOCATO : un « T » blanc sur disque bleu.
 * Sert de logo dans le bouton central de la barre d'onglets et les en-têtes.
 */
export function TocatoMark({ size = 56, backgroundColor = '#2563EB' }: TocatoMarkProps) {
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
      ]}>
      <Text style={[styles.letter, { fontSize: size * 0.48 }]}>T</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  letter: { color: '#FFFFFF', fontWeight: '800', letterSpacing: -1 },
});
