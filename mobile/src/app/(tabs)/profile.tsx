import { UserRound, FolderOpen } from 'lucide-react-native';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Copy, Panel, ScreenContainer, SculpturePanel, StatusBadge } from '@/components/ui/kit';
import { useAppTheme } from '@/theme';
import { useSession } from '@/session/context';

export default function Profile() {
  const { colors } = useAppTheme();
  const { projects } = useSession();
  const count = new Set(projects.flatMap(project => project.assetIds)).size;
  return <ScreenContainer title="Perfil" tab>
    <SculpturePanel title={'Tu espacio\ncreativo.'} caption="Assets Finder" variant="ribbon" />
    <Panel>
      <View className="flex-row items-center gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-full border" style={{ backgroundColor: colors.soft, borderColor: colors.border }}><UserRound size={26} color={colors.accent} strokeWidth={1.4} /></View>
        <View className="flex-1 gap-1"><Copy size={20}>Sin sesión</Copy><Copy tone="muted" size={12}>Cuenta no conectada</Copy></View>
      </View>
      <StatusBadge label="Espacio local" />
    </Panel>
    <View className="flex-row gap-3">
      <View className="flex-1"><Panel style={{ flex: 1 }}><Copy size={28}>{projects.length}</Copy><Copy tone="muted" size={12}>Proyectos</Copy></Panel></View>
      <View className="flex-1"><Panel style={{ flex: 1 }}><Copy size={28}>{count}</Copy><Copy tone="muted" size={12}>Assets guardados</Copy></Panel></View>
    </View>
    <Button secondary label="Ver mis proyectos" icon={FolderOpen} onPress={() => router.navigate('/projects')} />
  </ScreenContainer>;
}
