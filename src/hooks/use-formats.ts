import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { createFormatters, type Formatters } from '@/lib/format';

export function useFormats(): Formatters {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-CA' : 'fr-CA';
  return useMemo(() => createFormatters(locale), [locale]);
}
