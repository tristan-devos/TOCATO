import '@/i18n';

import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { loadSavedLanguage } from '@/i18n';
import { initAuth } from '@/lib/auth-store';

// Écran de démarrage gardé jusqu'à ce que la garde d'auth ait posé la bonne
// route (sinon l'accueil client, route par défaut, s'affiche un instant pour un
// prestataire). Plafonné : jamais bloqué si le chargement du rôle échoue.
void SplashScreen.preventAutoHideAsync();
const SPLASH_MAX_MS = 5000;
// Racines de chaque rôle : on n'y entre que par un replace de la garde d'auth.
// Sans animation, sinon le glissement iOS montre l'écran quitté (accueil client
// sous la vue prestataire) après le retrait de l'écran de démarrage.
const ROLE_ROOT: { animation: 'none' } = { animation: 'none' };

export default function RootLayout() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const palette = dark ? Colors.dark : Colors.light;

  useEffect(() => {
    void loadSavedLanguage();
    initAuth();
  }, []);

  const routeSettled = useAuthGuard();

  useEffect(() => {
    if (routeSettled) {
      // Une image de plus : la route posée est peinte avant le retrait.
      const frame = requestAnimationFrame(() => void SplashScreen.hideAsync());
      return () => cancelAnimationFrame(frame);
    }
    const timer = setTimeout(() => void SplashScreen.hideAsync(), SPLASH_MAX_MS);
    return () => clearTimeout(timer);
  }, [routeSettled]);

  // Align the navigation theme (backgrounds, native headers) with our tokens.
  const navTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme : DefaultTheme).colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.card,
      text: palette.text,
      border: palette.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
        }}>
        <Stack.Screen name="(tabs)" options={ROLE_ROOT} />
        <Stack.Screen name="(provider)" options={ROLE_ROOT} />
        <Stack.Screen name="(auth)" options={ROLE_ROOT} />
        <Stack.Screen name="apply" options={ROLE_ROOT} />
        <Stack.Screen
          name="booking/[service]"
          options={{ presentation: 'modal', gestureEnabled: false }}
        />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="reservation/[id]" />
        <Stack.Screen name="provider/[id]" />
        <Stack.Screen name="request/[id]" />
        <Stack.Screen name="job/[id]" />
        <Stack.Screen name="profile/addresses" />
        <Stack.Screen name="profile/payments" />
        <Stack.Screen name="profile/help" />
        <Stack.Screen name="admin/index" />
        <Stack.Screen name="admin/[id]" />
      </Stack>
    </ThemeProvider>
  );
}
