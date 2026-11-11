import '../global.css';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppTheme, useAppTheme } from '@/theme';
import { MediaProvider } from '@/media/context';
import { DemoSessionProvider } from '@/mocks/session';
import { fontFamily } from '@/theme/fonts';

void SplashScreen.preventAutoHideAsync();
export const unstable_settings = { initialRouteName: '(tabs)' };
function Navigation() {
  const { colors, dark } = useAppTheme();
  const base = dark ? DarkTheme : DefaultTheme;
  return <ThemeProvider value={{ ...base, fonts: {
    regular: { fontFamily: fontFamily.regular, fontWeight: '400' },
    medium: { fontFamily: fontFamily.medium, fontWeight: '500' },
    bold: { fontFamily: fontFamily.bold, fontWeight: '700' },
    heavy: { fontFamily: fontFamily.bold, fontWeight: '700' },
  }, colors: { ...base.colors, primary: colors.accent, background: colors.background, card: colors.surface, text: colors.text, border: colors.border } }}>
    <StatusBar style={dark ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="explore" options={{ headerShown: false }} />
    </Stack>
  </ThemeProvider>;
}
export default function RootLayout() {
  const [loaded, error] = useFonts({
    LINESeedJP_Bold: require('@/assets/fonts/LINESeedJP-Bold.otf'),
    LINESeedJP_Regular: require('@/assets/fonts/LINESeedJP-Regular.otf'),
    LINESeedJP_ExtraBold: require('@/assets/fonts/LINESeedJP-ExtraBold.otf'),
  });
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);
  if (error) throw error;
  if (!loaded) return null;

  return <AppTheme>
    <MediaProvider><DemoSessionProvider><Navigation /></DemoSessionProvider></MediaProvider>
  </AppTheme>;
}
