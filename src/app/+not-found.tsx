import { useRouter } from 'expo-router';
import { Compass } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { useTheme } from '@/hooks/use-theme';

export default function NotFoundScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <EmptyState
        icon={<Compass size={32} color={colors.primary} />}
        title={t('notFound.title')}
        message={t('notFound.message')}
        actionLabel={t('notFound.backHome')}
        onAction={() => router.replace('/(tabs)')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'center' },
});
