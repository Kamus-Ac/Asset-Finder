import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Box, CircleAlert, Clock, Check, RotateCcw } from 'lucide-react-native';
import { Art, Button, Choices, Copy, Panel, ScreenContainer, SculpturePanel, StatusBadge } from '@/components/ui/kit';
import { useAppTheme } from '@/theme';

const states = ['No disponible', 'Pendiente', 'En proceso', 'Completado', 'Fallido'] as const;
export default function Reconstruction() {
  const [state, setState] = useState<typeof states[number]>('No disponible');
  const { colors } = useAppTheme();
  const Icon = state === 'Completado' ? Check : state === 'Pendiente' ? Clock : state === 'Fallido' ? CircleAlert : Box;
  return <ScreenContainer title="Reconstrucción">
    <SculpturePanel title={'De referencia\na nueva forma.'} caption="Reconstrucción 3D · vista previa" />
    <Panel>
      <View className="flex-row items-center gap-4 py-2">
        <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: colors.soft }}>{state === 'En proceso' ? <ActivityIndicator color={colors.accent} /> : <Icon size={23} color={colors.accent} strokeWidth={1.4} />}</View>
        <View className="flex-1 gap-1"><Copy size={18}>{state}</Copy><Copy tone="muted" size={12}>{state === 'No disponible' ? 'Servicio sin conectar' : 'Estado de ejemplo'}</Copy></View>
      </View>
      {state === 'Completado' && <Art height={180} />}
      <Button label="Generar modelo 3D" icon={Box} disabled />
      {state === 'Fallido' && <Button secondary label="Reiniciar vista previa" icon={RotateCcw} onPress={() => setState('No disponible')} />}
    </Panel>
    <StatusBadge label="Vista previa" />
    <Choices values={states} value={state} onChange={setState} />
  </ScreenContainer>;
}
