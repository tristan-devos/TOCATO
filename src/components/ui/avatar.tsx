import { StyleSheet, Text, View } from 'react-native';

/** Palette de fonds d'avatar — choisie par hachage du nom pour rester stable. */
const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#0D9488', '#D97706', '#DB2777', '#475569'];

interface AvatarProps {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 44 }: AvatarProps) {
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
    <View
      style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '700', color: '#FFFFFF' },
});
