import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Retours haptiques de l'app : aucun écran n'appelle expo-haptics directement.
 * Réservés aux moments qui comptent (docs/experience-emotionnelle.md §3) :
 * sélection d'une option, et succès des actions clés (demande envoyée, devis
 * envoyé ou accepté, mission commencée ou terminée). Sans effet sur le web ; un
 * échec (appareil sans moteur haptique) est ignoré.
 */
const enabled = Platform.OS !== 'web';

function run(feedback: () => Promise<void>): void {
  if (!enabled) return;
  feedback().catch(() => undefined);
}

export const haptics = {
  /** Choix d'une option (chip, segment). */
  select: () => run(() => Haptics.selectionAsync()),
  /** Action clé réussie. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
