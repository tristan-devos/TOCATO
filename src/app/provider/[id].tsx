import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BadgeCheck } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Rating } from '@/components/rating';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormats } from '@/hooks/use-formats';
import { useProvider } from '@/lib/providers-store';

/** Profil public d'un prestataire, ouvert depuis un chat ou une réservation. */
export default function ProviderProfileScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { formatPrice } = useFormats();
  const { id } = useLocalSearchParams<{ id: string }>();

  const provider = useProvider(id);
  if (!provider) {
    return <Redirect href="/(tabs)" />;
  }

  const stats: { label: string; value: string }[] = [
    { label: t('providerProfile.jobsCompleted'), value: String(provider.jobsCompleted) },
    {
      label: t('providerProfile.hourlyRate'),
      value: t('providerProfile.hourlyRateValue', { price: formatPrice(provider.hourlyRate) }),
    },
    { label: t('providerProfile.memberSince'), value: provider.memberSince },
  ];

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <AppText variant="subheading" style={styles.headerTitle}>
          {t('providerProfile.title')}
        </AppText>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Avatar name={provider.name} size={72} />
          <View style={styles.nameRow}>
            <AppText variant="heading">{provider.name}</AppText>
            {provider.verified ? <BadgeCheck size={20} color={colors.primary} /> : null}
          </View>
          <Rating rating={provider.rating} reviewCount={provider.reviewCount} />
          <AppText variant="secondary">{provider.responseTime}</AppText>
          <View style={styles.services}>
            {provider.services.map((serviceId) => (
              <Badge
                key={serviceId}
                label={t(`services.${serviceId}.categoryName`)}
                tone="primary"
              />
            ))}
          </View>
        </View>

        <View>
          <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
            {t('providerProfile.about')}
          </AppText>
          <Card>
            <AppText variant="secondary">{provider.bio}</AppText>
          </Card>
        </View>

        <View>
          <AppText variant="label" style={styles.sectionLabel} color={colors.textSecondary}>
            {t('providerProfile.statsSection')}
          </AppText>
          <Card style={styles.statsCard}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statRow}>
                <AppText variant="secondary">{stat.label}</AppText>
                <AppText variant="label">{stat.value}</AppText>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
  },
  headerButton: { width: 30, padding: Spacing.one },
  headerTitle: { flex: 1, textAlign: 'center' },
  content: { padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
  hero: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one + 2 },
  services: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  sectionLabel: { marginBottom: Spacing.two, marginLeft: Spacing.one },
  statsCard: { gap: Spacing.two + 4 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
