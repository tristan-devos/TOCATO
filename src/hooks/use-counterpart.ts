import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useRole } from '@/lib/profile-store';
import { useProviderStore } from '@/lib/provider-store';
import { useProviders } from '@/lib/providers-store';
import type { Conversation } from '@/lib/types';

/**
 * Nom de « l'autre » dans une conversation, selon le rôle : le prestataire pour
 * un client, le prénom du client pour un prestataire. Renvoie un résolveur
 * (utilisable dans un useMemo de liste), stable tant que ses données ne changent pas.
 */
export function useCounterpartName(): (conversation: Conversation) => string {
  const { t } = useTranslation();
  const role = useRole();
  const providers = useProviders();
  const clientNames = useProviderStore((s) => s.clientNames);

  return useCallback(
    (conversation: Conversation) =>
      role === 'provider'
        ? (clientNames[conversation.id] ?? t('common.client'))
        : (providers.find((p) => p.id === conversation.providerId)?.name ??
          t('common.provider')),
    [role, providers, clientNames, t],
  );
}
