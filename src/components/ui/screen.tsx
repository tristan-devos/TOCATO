import type { ReactElement, ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type RefreshControlProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ScreenProps {
  children: ReactNode;
  /** ScrollView par défaut ; false pour les écrans à FlatList */
  scroll?: boolean;
  edges?: Edge[];
  /** « Tirer pour rafraîchir » (écrans en ScrollView seulement). */
  refreshControl?: ReactElement<RefreshControlProps>;
}

/** Conteneur d'écran : fond, safe area et padding standards. */
export function Screen({ children, scroll = true, edges = ['top'], refreshControl }: ScreenProps) {
  const colors = useTheme();

  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={refreshControl}
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
