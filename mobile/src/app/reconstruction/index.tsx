import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Box, CircleAlert, Clock, Check, RotateCcw } from 'lucide-react-native';
import { Art, Button, Choices, Copy, Panel, ScreenContainer, StatusBadge } from '@/components/ui/kit';
import { useAppTheme } from '@/theme';
const states = ['No disponible', 'Pendiente', 'En proceso', 'Completado', 'Fallido'] as const;
export default function Reconstruction() {
  const [state, setState] = useState<typeof states[number]>('No disponible');
  const { colors } = useAppTheme();
  const Icon = state === 'Completado' ? Check : state === 'Pendiente' ? Clock : state === 'Fallido' ? CircleAlert : Box;
  return <ScreenContainer title="Reconstrucción">
    <Panel>
      <View className="items-center gap-4 py-8">{state === 'En proceso' ? <ActivityIndicator size="large" color={colors.accent} /> : <Icon size={42} color={colors.accent} strokeWidth={1.4} />}<Copy size={23} bold>{state}</Copy><Copy tone="muted" size={13}>{state === 'No disponible' ? 'Servicio sin conectar' : 'Estado de ejemplo'}</Copy></View>
      {state === 'Completado' && <Art height={180} />}
      <Button label="Generar modelo 3D" icon={Box} disabled />
      {state === 'Fallido' && <Button secondary label="Reiniciar vista previa" icon={RotateCcw} onPress={() => setState('No disponible')} />}
    </Panel>
    <StatusBadge label="Vista previa" />
    <Choices values={states} value={state} onChange={setState} />
  </ScreenContainer>;
}
