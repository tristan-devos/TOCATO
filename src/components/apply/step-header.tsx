import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';

/** Titre + sous-titre d'une étape du formulaire d'adhésion. */
export function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.base}>
      <AppText variant="heading">{title}</AppText>
      <AppText variant="secondary">{subtitle}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.one },
});
