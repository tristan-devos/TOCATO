import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface PageHeaderProps {
  title: string;
}

/** En-tête simple : bouton retour + titre centré. */
export function PageHeader({ title }: PageHeaderProps) {
  const colors = useTheme();
  const router = useRouter();

  return (
    <View style={styles.base}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.button}>
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>
      <AppText variant="subheading" style={styles.title}>
        {title}
      </AppText>
      <View style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
  },
  button: { width: 30, padding: Spacing.one },
  title: { flex: 1, textAlign: 'center' },
});
