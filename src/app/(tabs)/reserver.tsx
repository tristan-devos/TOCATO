import { useRouter } from 'expo-router';
import { BadgeCheck, FileText, LockKeyhole } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ServiceCard } from '@/components/service-card';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SERVICE_IDS, SERVICES } from '@/lib/services';
import type { ServiceId } from '@/lib/types';

const REASSURANCES = [
  { icon: BadgeCheck, text: 'Prestataires vérifiés et notés par la communauté' },
  { icon: FileText, text: 'Devis gratuit avant toute intervention' },
  { icon: LockKeyhole, text: 'Prix convenu dans le chat, sans surprise' },
];

export default function ReserverScreen() {
  const colors = useTheme();
  const router = useRouter();

  const openBooking = (serviceId: ServiceId) =>
    router.push({ pathname: '/booking/[service]', params: { service: serviceId } });

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Réserver une prestation</AppText>
        <AppText variant="secondary">
          Choisissez un service, décrivez votre besoin et recevez un devis en quelques minutes.
        </AppText>
      </View>

      <View style={styles.servicesList}>
        {SERVICE_IDS.map((id) => (
          <ServiceCard key={id} service={SERVICES[id]} onPress={() => openBooking(id)} />
        ))}
      </View>

      <View style={[styles.reassurance, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {REASSURANCES.map(({ icon: Icon, text }) => (
          <View key={text} style={styles.reassuranceRow}>
            <Icon size={18} color={colors.primary} />
            <AppText variant="secondary" style={styles.reassuranceText}>
              {text}
            </AppText>
          </View>
        ))}
      </View>

      <AppText variant="small" style={styles.footer} color={colors.textSecondary}>
        D’autres services arrivent bientôt à Montréal.
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
