import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useRole } from '@/lib/profile-store';
import type { Message } from '@/lib/types';

/**
 * Texte affichable d'un message système : traduit selon la langue active ET le
 * côté de celui qui lit (« Vous avez refusé le devis » pour le client, « Le
 * client a refusé votre devis » pour le prestataire). Les anciens messages sans
 * clé retombent sur leur texte enregistré.
 */
export function useSystemMessageText(): (message: Message) => string {
  const { t } = useTranslation();
  const role = useRole() ?? 'client';

  return useCallback(
    (message: Message) =>
      message.systemKey ? t(`systemMessages.${message.systemKey}.${role}`) : message.text,
    [role, t],
  );
}
