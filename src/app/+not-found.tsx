import { useRouter } from 'expo-router';
import { Compass } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { useTheme } from '@/hooks/use-theme';

export default function NotFoundScreen() {
  const colors = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <EmptyState
        icon={<Compass size={32} color={colors.primary} />}
        title="Page introuvable"
        message="Cette page n'existe pas ou a été déplacée."
        actionLabel="Retour à l'accueil"
        onAction={() => router.replace('/(tabs)')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'center' },
});
