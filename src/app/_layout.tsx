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
      void SplashScreen.hideAsync();
      return;
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
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(provider)" />
        <Stack.Screen name="(auth)" />
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
