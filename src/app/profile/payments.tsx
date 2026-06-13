import { CreditCard, Plus } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ListItem } from '@/components/ui/list-item';
import { PageHeader } from '@/components/ui/page-header';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MOCK_CARDS = [
  { id: 'card-1', brand: 'Visa', last4: '4242', expiry: '08/27', isDefault: true },
  { id: 'card-2', brand: 'Mastercard', last4: '8210', expiry: '02/26', isDefault: false },
];

export default function PaymentsScreen() {
  const colors = useTheme();
  const { t } = useTranslation();

  const comingSoon = () => {
    Alert.alert(t('payments.addCardTitle'), t('payments.addCardMessage'));
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <PageHeader title={t('payments.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          {MOCK_CARDS.map((card) => (
            <ListItem
              key={card.id}
              title={`${card.brand} •••• ${card.last4}`}
              subtitle={t('payments.expires', { date: card.expiry })}
              leading={<CreditCard size={20} color={colors.primary} />}
              trailing={
                card.isDefault ? <Badge label={t('payments.default')} tone="primary" /> : undefined
              }
            />
          ))}
        </Card>

        <Pressable
          onPress={comingSoon}
          style={({ pressed }) => [styles.addRow, { opacity: pressed ? 0.6 : 1 }]}>
          <Plus size={18} color={colors.primary} />
          <AppText variant="label" color={colors.primary}>
            {t('payments.addCard')}
          </AppText>
        </Pressable>

        <View
          style={[styles.note, { backgroundColor: colors.primaryMuted, borderRadius: Radius.md }]}>
          <AppText variant="secondary" color={colors.primary}>
            {t('payments.note')}
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.four },
  card: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.two },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  note: { padding: Spacing.three },
});
