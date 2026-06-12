import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ScreenProps {
  children: ReactNode;
  /** ScrollView par défaut ; false pour les écrans à FlatList */
  scroll?: boolean;
  edges?: Edge[];
}

/** Conteneur d'écran : fond, safe area et padding standards. */
export function Screen({ children, scroll = true, edges = ['top'] }: ScreenProps) {
  const colors = useTheme();

  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
});
