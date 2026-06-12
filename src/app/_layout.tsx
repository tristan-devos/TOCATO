import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const palette = dark ? Colors.dark : Colors.light;

  // Aligne le thème de navigation (fonds, en-têtes natifs) sur nos tokens.
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
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking/[service]" options={{ presentation: 'modal', gestureEnabled: false }} />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="reservation/[id]" />
        <Stack.Screen name="profile/addresses" />
        <Stack.Screen name="profile/payments" />
        <Stack.Screen name="profile/help" />
      </Stack>
    </ThemeProvider>
  );
}
