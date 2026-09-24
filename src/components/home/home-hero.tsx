import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { HomeIllustration } from '@/components/illustrations/home-illustration';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';

/** Accroche de l'accueil client : la promesse, et une seule action pour commencer. */
export function HomeHero({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.texts}>
          <AppText variant="heading">{t('home.heroTitle')}</AppText>
          <AppText variant="secondary">{t('home.heroMessage')}</AppText>
        </View>
        <HomeIllustration width={112} />
      </View>
      <Button title={t('home.heroAction')} onPress={onStart} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  texts: { flex: 1, gap: Spacing.two },
});
