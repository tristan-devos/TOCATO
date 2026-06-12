import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ListItemProps {
  title: string;
  subtitle?: string;
  /** Icône (ou avatar) affichée à gauche */
  leading?: ReactNode;
  /** Élément à droite — par défaut un chevron si onPress est fourni */
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

export function ListItem({ title, subtitle, leading, trailing, onPress, destructive }: ListItemProps) {
  const colors = useTheme();

  const content = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.texts}>
        <Text
          style={[styles.title, { color: destructive ? colors.destructive : colors.text }]}
          numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? (onPress ? <ChevronRight size={18} color={colors.textSecondary} /> : null)}
    </>
  );

  if (!onPress) {
    return <View style={styles.base}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        pressed && { backgroundColor: colors.backgroundElement, borderRadius: Radius.md },
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 12,
    paddingHorizontal: Spacing.two,
  },
  leading: { width: 36, alignItems: 'center' },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: FontSize.base, fontWeight: '500' },
  subtitle: { fontSize: FontSize.sm },
});
