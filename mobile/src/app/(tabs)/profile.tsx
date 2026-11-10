import { UserRound } from 'lucide-react-native';
import { View } from 'react-native';
import { Copy, Panel, ScreenContainer } from '@/components/ui/kit';
import { useAppTheme } from '@/theme';

export default function Profile() {
  const { colors } = useAppTheme();
  return <ScreenContainer title="Perfil" tab>
    <Panel>
      <View className="items-center gap-4 py-6">
        <UserRound size={48} color={colors.muted} strokeWidth={1.5} />
        <Copy size={22} bold>Sin sesión</Copy>
        <Copy tone="muted">Cuenta no conectada</Copy>
      </View>
    </Panel>
  </ScreenContainer>;
}
