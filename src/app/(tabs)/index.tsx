import { useRouter } from 'expo-router';
import { MapPin, Search, ShieldCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookingCard } from '@/components/booking-card';
import { ProviderRow } from '@/components/provider-row';
import { ServiceCard } from '@/components/service-card';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PROVIDERS } from '@/lib/mock-data';
import { SERVICE_IDS, SERVICES } from '@/lib/services';
import { useAppStore, useHighlightedBooking } from '@/lib/store';
import type { ServiceId } from '@/lib/types';

const HOW_IT_WORKS = [
  { step: '1', title: 'Décrivez votre besoin', detail: 'Quelques questions, deux minutes.' },
  { step: '2', title: 'Recevez un devis', detail: 'Le prestataire vous répond dans le chat.' },
  { step: '3', title: 'Confirmez sereinement', detail: 'Prestataires vérifiés, prix convenu à l’avance.' },
];

export default function HomeScreen() {
  const colors = useTheme();
  const router = useRouter();
  const firstName = useAppStore((s) => s.user.name).split(' ')[0];
  const highlighted = useHighlightedBooking();
  const topProviders = PROVIDERS.filter((p) => p.verified).slice(0, 3);

  const openBooking = (serviceId: ServiceId) =>
    router.push({ pathname: '/booking/[service]', params: { service: serviceId } });

  return (
    <Screen>
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <AppText variant="title">Bonjour {firstName}</AppText>
          <View style={styles.location}>
            <MapPin size={14} color={colors.textSecondary} />
            <AppText variant="secondary">Montréal, QC</AppText>
          </View>
        </View>
      </View>

      {/* Barre de recherche (raccourci vers Réserver) */}
      <Pressable
        onPress={() => router.push('/(tabs)/reserver')}
        style={({ pressed }) => [
          styles.search,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
        ]}>
        <Search size={18} color={colors.textSecondary} />
        <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>
          De quoi avez-vous besoin ?
        </Text>
      </Pressable>

      {/* Réservation en cours */}
      {highlighted ? (
        <View>
          <SectionHeader
            title="En ce moment"
            actionLabel="Tout voir"
            onAction={() => router.push('/(tabs)/reservations')}
          />
          <BookingCard
            booking={highlighted}
            onPress={() =>
              router.push({ pathname: '/reservation/[id]', params: { id: highlighted.id } })
            }
          />
        </View>
      ) : null}

      {/* Services */}
      <View>
        <SectionHeader title="Nos services" />
        <View style={styles.servicesList}>
          {SERVICE_IDS.map((id) => (
            <ServiceCard key={id} service={SERVICES[id]} onPress={() => openBooking(id)} />
          ))}
        </View>
      </View>

      {/* Comment ça marche */}
      <View>
        <SectionHeader title="Comment ça marche" />
        <Card>
          <View style={styles.steps}>
            {HOW_IT_WORKS.map((item) => (
              <View key={item.step} style={styles.stepRow}>
                <View style={[styles.stepCircle, { backgroundColor: colors.primaryMuted }]}>
                  <Text style={[styles.stepNumber, { color: colors.primary }]}>{item.step}</Text>
                </View>
                <View style={styles.stepTexts}>
                  <AppText variant="label">{item.title}</AppText>
                  <AppText variant="secondary">{item.detail}</AppText>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </View>

      {/* Prestataires populaires */}
      <View>
        <SectionHeader title="Prestataires populaires" />
        <Card style={styles.providersCard}>
          {topProviders.map((provider, index) => (
            <View key={provider.id}>
              {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
              <ProviderRow provider={provider} />
            </View>
          ))}
        </Card>
      </View>

      {/* Confiance */}
      <View style={[styles.trustBanner, { backgroundColor: colors.primaryMuted }]}>
        <ShieldCheck size={20} color={colors.primary} />
        <Text style={[styles.trustText, { color: colors.primary }]}>
          Prestataires vérifiés · Devis gratuit · Support 7 j/7
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  searchPlaceholder: { fontSize: FontSize.base },
  servicesList: { gap: Spacing.two + 4 },
  steps: { gap: Spacing.three },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: { fontWeight: '700', fontSize: FontSize.sm },
  stepTexts: { flex: 1, gap: 2 },
  providersCard: { gap: Spacing.three },
  divider: { height: StyleSheet.hairlineWidth, marginBottom: Spacing.three },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  trustText: { fontSize: FontSize.sm, fontWeight: '600', flex: 1 },
});
