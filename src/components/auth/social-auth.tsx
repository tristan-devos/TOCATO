import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/lib/auth-store';

// Finalise une éventuelle session d'auth restée ouverte (no-op sur natif,
// requis pour fermer la fenêtre OAuth sur web).
WebBrowser.maybeCompleteAuthSession();

/** Bloc de connexion via fournisseur tiers (OAuth navigateur). Partagé login/signup. */
export function SocialAuth() {
  const colors = useTheme();
  const { t } = useTranslation();
  const signInWithOAuth = useAuthStore((s) => s.signInWithOAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onGoogle = async () => {
    setError(null);
    setLoading(true);
    const result = await signInWithOAuth('google');
    setLoading(false);
    // En cas de succès, la garde de navigation redirige automatiquement.
    if (result.error) setError(result.error);
  };

  return (
    <View style={styles.base}>
      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <AppText variant="small" color={colors.textSecondary}>
          {t('auth.orDivider')}
        </AppText>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>

      <Button
        title={t('auth.continueWithGoogle')}
        onPress={onGoogle}
        variant="outline"
        size="lg"
        loading={loading}
      />

      {error ? (
        <AppText variant="secondary" color={colors.destructive}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.three },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
