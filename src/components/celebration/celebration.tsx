import { Modal, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedCheck } from '@/components/celebration/animated-check';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CelebrationAction {
  label: string;
  onPress: () => void;
}

interface CelebrationProps {
  title: string;
  message: string;
  primary: CelebrationAction;
  secondary?: CelebrationAction;
}

/**
 * Écran de célébration, réservé aux vrais moments (docs/experience-emotionnelle.md
 * §3) : demande envoyée, devis accepté, mission terminée. Le retour haptique est
 * déclenché par l'action qui y mène (lib/haptics).
 */
export function Celebration({ title, message, primary, secondary }: CelebrationProps) {
  const colors = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.body}>
        <AnimatedCheck />
        <Animated.View entering={FadeInDown.delay(250).duration(300)} style={styles.texts}>
          <AppText variant="title" style={styles.centered}>
            {title}
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.centered}>
            {message}
          </AppText>
        </Animated.View>
      </View>
      <View style={styles.footer}>
        <Button title={primary.label} size="lg" onPress={primary.onPress} />
        {secondary ? (
          <Button title={secondary.label} variant="ghost" onPress={secondary.onPress} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

interface CelebrationModalProps extends Omit<CelebrationProps, 'primary'> {
  visible: boolean;
  /** Libellé du bouton qui ferme la célébration. */
  closeLabel: string;
  onClose: () => void;
}

/** Célébration par-dessus l'écran courant (devis accepté, mission terminée). */
export function CelebrationModal({ visible, closeLabel, onClose, ...rest }: CelebrationModalProps) {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <Celebration {...rest} primary={{ label: closeLabel, onPress: onClose }} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    padding: Spacing.five,
  },
  texts: { gap: Spacing.two },
  centered: { textAlign: 'center' },
  footer: { padding: Spacing.three, paddingBottom: Spacing.two, gap: Spacing.two },
});
