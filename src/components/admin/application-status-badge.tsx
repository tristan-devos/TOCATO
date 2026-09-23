import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import type { ApplicationStatus } from '@/lib/types';

const TONE = { submitted: 'warning', approved: 'success', rejected: 'destructive' } as const;

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useTranslation();
  return <Badge label={t(`admin.status.${status}`)} tone={TONE[status]} />;
}
