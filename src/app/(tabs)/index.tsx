import { useRouter } from 'expo-router';
import { MapPin, Search, ShieldCheck } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BookingCard } from '@/components/booking-card';
import { ProviderRow } from '@/components/provider-row';
import { ServiceCard } from '@/components/service-card';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useProfile } from '@/lib/profile-store';
import { useProviders } from '@/lib/providers-store';
import { SERVICE_IDS } from '@/lib/services';
import { useHighlightedBooking } from '@/lib/store';
import type { ServiceId } from '@/lib/types';

export default function HomeScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const profile = useProfile();
  const firstName = (profile?.name ?? '').split(' ')[0];
  const highlighted = useHighlightedBooking();
  const providers = useProviders();
  const topProviders = useMemo(
    () => providers.filter((p) => p.verified).slice(0, 3),
    [providers],
  );

  const openBooking = (serviceId: ServiceId) =>
    router.push({ pathname: '/booking/[service]', params: { service: serviceId } });

  const howItWorks = [
    { step: '1', title: t('home.step1Title'), detail: t('home.step1Detail') },
    { step: '2', title: t('home.step2Title'), detail: t('home.step2Detail') },
    { step: '3', title: t('home.step3Title'), detail: t('home.step3Detail') },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <AppText variant="title">{t('home.greeting', { name: firstName })}</AppText>
          <View style={styles.location}>
            <MapPin size={14} color={colors.textSecondary} />
            <AppText variant="secondary">{t('home.location')}</AppText>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/reserver')}
        style={({ pressed }) => [
          styles.search,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
        ]}>
        <Search size={18} color={colors.textSecondary} />
        <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>
          {t('home.searchPlaceholder')}
        </Text>
      </Pressable>

      {highlighted ? (
        <View>
          <SectionHeader
            title={t('home.currentSection')}
            actionLabel={t('home.viewAll')}
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

      <View>
        <SectionHeader title={t('home.servicesSection')} />
        <View style={styles.servicesList}>
          {SERVICE_IDS.map((id) => (
            <ServiceCard key={id} serviceId={id} onPress={() => openBooking(id)} />
          ))}
        </View>
      </View>

      <View>
        <SectionHeader title={t('home.howItWorksSection')} />
        <Card>
          <View style={styles.steps}>
            {howItWorks.map((item) => (
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

      {/* Masquée tant qu'aucune fiche vérifiée n'existe (plus de fiches de démo). */}
      {topProviders.length > 0 ? (
        <View>
          <SectionHeader title={t('home.popularProviders')} />
          <Card style={styles.providersCard}>
            {topProviders.map((provider, index) => (
              <View key={provider.id}>
                {index > 0 ? (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                ) : null}
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/provider/[id]', params: { id: provider.id } })
                  }>
                  <ProviderRow provider={provider} />
                </Pressable>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <View style={[styles.trustBanner, { backgroundColor: colors.primaryMuted }]}>
        <ShieldCheck size={20} color={colors.primary} />
        <Text style={[styles.trustText, { color: colors.primary }]}>
          {t('home.trustBadge')}
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
