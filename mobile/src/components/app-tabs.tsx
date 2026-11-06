import { NativeTabs } from 'expo-router/native-tabs';
import { useAppTheme } from '@/theme';
export default function AppTabs() {
  const { colors } = useAppTheme();
  return <NativeTabs backgroundColor={colors.surface} tintColor={colors.accent} indicatorColor={colors.soft}>
    <NativeTabs.Trigger name="home">
      <NativeTabs.Trigger.Icon md="home" sf="house.fill" />
      <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="projects">
      <NativeTabs.Trigger.Icon md="folder" sf="folder.fill" />
      <NativeTabs.Trigger.Label>Proyectos</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="settings">
      <NativeTabs.Trigger.Icon md="settings" sf="gearshape.fill" />
      <NativeTabs.Trigger.Label>Ajustes</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  </NativeTabs>;
}
