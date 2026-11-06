import { Tabs } from 'expo-router';
import { useAppTheme } from '@/theme';
export default function AppTabs() {
  const { colors } = useAppTheme();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border } }}>
    <Tabs.Screen name="home" options={{ title: 'Inicio' }} />
    <Tabs.Screen name="projects" options={{ title: 'Proyectos' }} />
    <Tabs.Screen name="settings" options={{ title: 'Ajustes' }} />
  </Tabs>;
}
