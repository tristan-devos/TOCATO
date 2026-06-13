import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SERVICES, type ServiceDefinition } from '@/lib/services';
import type { ServiceId } from '@/lib/types';

/**
 * Returns a fully localized ServiceDefinition for the given service ID.
 * All user-facing strings (name, tagline, question titles, option labels)
 * come from the active i18n language.
 */
export function useLocalizedService(id: ServiceId): ServiceDefinition {
  const { t } = useTranslation();
  const base = SERVICES[id];

  return useMemo(
    () => ({
      ...base,
      name: t(`services.${id}.name`),
      categoryName: t(`services.${id}.categoryName`),
      tagline: t(`services.${id}.tagline`),
      questions: base.questions.map((q) => ({
        ...q,
        title: t(`services.${id}.questions.${q.id}.title`),
        subtitle:
          q.subtitle !== undefined
            ? t(`services.${id}.questions.${q.id}.subtitle`)
            : undefined,
        options: q.options.map((o) => ({
          ...o,
          label: t(`services.${id}.questions.${q.id}.options.${o.id}.label`),
          hint:
            o.hint !== undefined
              ? t(`services.${id}.questions.${q.id}.options.${o.id}.hint`)
              : undefined,
        })),
      })),
    }),
    [t, id, base],
  );
}
