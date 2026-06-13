import { useRouter } from 'expo-router';
import { BadgeCheck, FileText, LockKeyhole } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ServiceCard } from '@/components/service-card';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SERVICE_IDS } from '@/lib/services';
import type { ServiceId } from '@/lib/types';

export default function ReserverScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const reassurances = [
    { icon: BadgeCheck, text: t('bookScreen.reassurance1') },
    { icon: FileText, text: t('bookScreen.reassurance2') },
    { icon: LockKeyhole, text: t('bookScreen.reassurance3') },
  ];

  const openBooking = (serviceId: ServiceId) =>
    router.push({ pathname: '/booking/[service]', params: { service: serviceId } });

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">{t('bookScreen.title')}</AppText>
        <AppText variant="secondary">{t('bookScreen.subtitle')}</AppText>
      </View>

      <View style={styles.servicesList}>
        {SERVICE_IDS.map((id) => (
          <ServiceCard key={id} serviceId={id} onPress={() => openBooking(id)} />
        ))}
      </View>

      <View
        style={[styles.reassurance, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {reassurances.map(({ icon: Icon, text }) => (
          <View key={text} style={styles.reassuranceRow}>
            <Icon size={18} color={colors.primary} />
            <AppText variant="secondary" style={styles.reassuranceText}>
              {text}
            </AppText>
          </View>
        ))}
      </View>

      <AppText variant="small" style={styles.footer} color={colors.textSecondary}>
        {t('bookScreen.comingSoon')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two },
  servicesList: { gap: Spacing.two + 4 },
  reassurance: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  reassuranceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 4 },
  reassuranceText: { flex: 1 },
  footer: { textAlign: 'center' },
});
