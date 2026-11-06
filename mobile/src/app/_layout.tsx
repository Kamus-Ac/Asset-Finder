import { Stack, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { DemoSessionProvider } from '@/mocks/session';
import { StatusBar } from 'expo-status-bar';
import { AppTheme, useAppTheme } from '@/theme';
export const unstable_settings = { initialRouteName: '(tabs)' };
function Navigation() {
  const { colors, dark } = useAppTheme();
  const base = dark ? DarkTheme : DefaultTheme;
  return <ThemeProvider value={{ ...base, colors: { ...base.colors, primary: colors.accent, background: colors.background, card: colors.surface, text: colors.text, border: colors.border } }}>
    <StatusBar style={dark ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="explore" options={{ headerShown: false }} />
    </Stack>
  </ThemeProvider>;
}
export default function RootLayout() {
  return <AppTheme>
    <DemoSessionProvider>
      <Navigation />
    </DemoSessionProvider>
  </AppTheme>;
}
