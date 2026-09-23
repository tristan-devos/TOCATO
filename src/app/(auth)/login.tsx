import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TextField } from '@/components/ui/text-field';
import { SocialAuth } from '@/components/auth/social-auth';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/lib/auth-store';

export default function LoginScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const signIn = useAuthStore((s) => s.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError(t('auth.missingFields'));
      return;
    }
    setError(null);
    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);
    // En cas de succès, la garde de navigation redirige automatiquement.
    if (result.error) setError(result.error);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">{t('auth.loginTitle')}</AppText>
        <AppText variant="secondary">{t('auth.loginSubtitle')}</AppText>
      </View>

      <View style={styles.form}>
        <TextField
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.emailPlaceholder')}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          inputMode="email"
        />
        <TextField
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.passwordPlaceholder')}
          autoCapitalize="none"
          autoComplete="current-password"
          secureTextEntry
        />

        {error ? (
          <AppText variant="secondary" color={colors.destructive}>
            {error}
          </AppText>
        ) : null}

        <Button title={t('auth.signIn')} onPress={submit} loading={loading} size="lg" />

        <SocialAuth />
      </View>

      <View style={styles.footer}>
        <AppText variant="secondary">{t('auth.noAccount')}</AppText>
        <Link href="/signup" style={styles.link}>
          <AppText variant="label" color={colors.primary}>
            {t('auth.goToSignup')}
          </AppText>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two, marginTop: Spacing.five },
  form: { gap: Spacing.three },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  link: { paddingVertical: Spacing.one },
});
