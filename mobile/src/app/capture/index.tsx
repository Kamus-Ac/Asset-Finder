import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, Art, Button, Choices, Copy, DemoNotice, Panel, ScreenContainer, StatusBadge } from '@/components/ui/kit';
import { useAppTheme } from '@/theme';
export default function Capture() {
  const params = useLocalSearchParams<{
    mode?: string;
  }>();
  const [mode, setMode] = useState(params.mode === 'video' ? 'Video' : 'Foto');
  const [permission, setPermission] = useState('Sin solicitar');
  const { colors } = useAppTheme();
  return <ScreenContainer title="Capturar referencia">
    <AppHeader eyebrow="01 / Referencia" title="Encuentra tu perspectiva" subtitle="Centra un objeto y deja espacio a su alrededor." />
    <DemoNotice text="Cámara de demostración. No se accede al dispositivo ni se solicitan permisos." />
    <View style={{ borderRadius: 26, backgroundColor: colors.stage, padding: 18, gap: 15 }}>
      <Art height={300} />
      <View style={{ position: 'absolute', top: 55, left: '24%', width: '52%', height: 235, borderWidth: 2, borderColor: colors.accent, borderRadius: 24 }} />
      <StatusBadge label="PREVISUALIZACIÓN ILUSTRADA" />
    </View>
    <Choices values={['Foto', 'Video']} value={mode} onChange={setMode} />
    <Button label={mode === 'Foto' ? 'Usar fotografía de ejemplo' : 'Usar video de ejemplo'} onPress={() => router.push({ pathname: '/reference', params: { mode: mode === 'Video' ? 'video' : 'photo' } })} />
    <Button secondary label="Ver archivos de demostración" onPress={() => router.push('/reference')} />
    <Panel>
      <Copy bold>Permisos · vista de ejemplo</Copy>
      <Choices values={['Sin solicitar', 'Denegado']} value={permission} onChange={setPermission} />
      <Copy tone="muted">{permission === 'Denegado' ? 'En la versión integrada podrás habilitar la cámara desde los ajustes de Android.' : 'La versión integrada pedirá permiso antes de activar la cámara.'}</Copy>
    </Panel>
  </ScreenContainer>;
}
