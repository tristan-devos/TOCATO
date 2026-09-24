import '@/i18n';

import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors, FONT_FILES } from '@/constants/theme';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { loadSavedLanguage } from '@/i18n';
import { initAuth, useAuthStatus, useDataReady } from '@/lib/auth-store';

// Écran de démarrage gardé jusqu'à ce que la garde d'auth ait posé la bonne
// route (sinon l'accueil client, route par défaut, s'affiche un instant pour un
// prestataire) et, si connecté, que les données soient chargées (sinon un écran
// vide s'affiche un instant). Plafonné : jamais bloqué si un chargement échoue.
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

  // Police : rien n'est rendu avant son chargement (un texte rendu avec une
  // famille absente retomberait sur la police système). En cas d'échec, l'app
  // démarre quand même avec la police système.
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);
  const fontsSettled = fontsLoaded || fontError !== null;

  const routeSettled = useAuthGuard(fontsSettled);
  const status = useAuthStatus();
  const dataReady = useDataReady();
  const ready = fontsSettled && routeSettled && (status !== 'authenticated' || dataReady);

  useEffect(() => {
    if (ready) {
      // Une image de plus : la route posée est peinte avant le retrait.
      const frame = requestAnimationFrame(() => void SplashScreen.hideAsync());
      return () => cancelAnimationFrame(frame);
    }
    const timer = setTimeout(() => void SplashScreen.hideAsync(), SPLASH_MAX_MS);
    return () => clearTimeout(timer);
  }, [ready]);

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

  if (!fontsSettled) return null;

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
        <Stack.Screen name="admin/photo/[providerId]" />
      </Stack>
    </ThemeProvider>
  );
}
