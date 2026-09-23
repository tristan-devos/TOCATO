import '@/i18n';

import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { loadSavedLanguage } from '@/i18n';
import { initAuth } from '@/lib/auth-store';

export default function RootLayout() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const palette = dark ? Colors.dark : Colors.light;

  useEffect(() => {
    void loadSavedLanguage();
    initAuth();
  }, []);

  useAuthGuard();

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
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="booking/[service]"
          options={{ presentation: 'modal', gestureEnabled: false }}
        />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="reservation/[id]" />
        <Stack.Screen name="provider/[id]" />
        <Stack.Screen name="profile/addresses" />
        <Stack.Screen name="profile/payments" />
        <Stack.Screen name="profile/help" />
      </Stack>
    </ThemeProvider>
  );
}
