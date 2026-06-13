import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthTextField } from '@/components/auth/auth-text-field';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/lib/auth-store';

const MIN_PASSWORD = 6;

export default function SignupScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const signUp = useAuthStore((s) => s.signUp);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError(t('auth.missingFields'));
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    setError(null);
    setLoading(true);
    const result = await signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    // Session immédiate -> la garde redirige. Sinon, confirmation par courriel requise.
    if (result.needsConfirmation) {
      Alert.alert(t('auth.confirmEmailTitle'), t('auth.confirmEmailMessage'));
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">{t('auth.signupTitle')}</AppText>
        <AppText variant="secondary">{t('auth.signupSubtitle')}</AppText>
      </View>

      <View style={styles.form}>
        <AuthTextField
          label={t('auth.name')}
          value={name}
          onChangeText={setName}
          placeholder={t('auth.namePlaceholder')}
          autoCapitalize="words"
          autoComplete="name"
        />
        <AuthTextField
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.emailPlaceholder')}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          inputMode="email"
        />
        <AuthTextField
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.passwordPlaceholder')}
          autoCapitalize="none"
          autoComplete="new-password"
          secureTextEntry
        />

        {error ? (
          <AppText variant="secondary" color={colors.destructive}>
            {error}
          </AppText>
        ) : null}

        <Button title={t('auth.signUp')} onPress={submit} loading={loading} size="lg" />
      </View>

      <View style={styles.footer}>
        <AppText variant="secondary">{t('auth.haveAccount')}</AppText>
        <Link href="/login" style={styles.link}>
          <AppText variant="label" color={colors.primary}>
            {t('auth.goToLogin')}
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
