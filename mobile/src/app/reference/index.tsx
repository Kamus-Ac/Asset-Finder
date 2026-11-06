import { referenceDemo } from '@/mocks/scenarios';
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, Art, Button, Choices, Copy, DemoNotice, Panel, Row, ScreenContainer, StatusBadge } from '@/components/ui/kit';
export default function Reference() {
  const params = useLocalSearchParams<{
    mode?: string;
  }>();
  const [mode, setMode] = useState(params.mode === 'video' ? 'Video' : 'Imagen');
  const [frame, setFrame] = useState(referenceDemo.initialFrame);
  return <ScreenContainer title="Tu referencia">
    <AppHeader eyebrow="01 / Referencia" title="Un buen punto de partida" subtitle="Revisa la referencia antes de seleccionar un objeto." />
    <DemoNotice />
    <Choices values={['Imagen', 'Video']} value={mode} onChange={setMode} />
    <Panel>
      <Art height={310} />
      <StatusBadge label={mode === 'Video' ? 'VIDEO ILUSTRADO · DEMO' : 'IMAGEN LOCAL · DEMO'} />
      <Copy bold>{mode === 'Video' ? `${referenceDemo.videoName} · ejemplo` : `${referenceDemo.imageName} · ejemplo`}</Copy>
      <Copy tone="muted">{mode === 'Video' ? 'Selecciona un fotograma de la línea de tiempo ilustrativa.' : 'Referencia de mobiliario incluida en la aplicación.'}</Copy>
    </Panel>
    {mode === 'Video' && <Panel>
      <Row>{referenceDemo.frames.map(t => <View key={t} style={{ flex: 1 }}>
        <Art height={75} />
      </View>)}</Row>
      <Choices values={referenceDemo.frames} value={frame} onChange={setFrame} />
      <Copy size={12} tone="muted">Fotograma {frame} · selección visual; no se reproduce video ni se extraen imágenes.</Copy>
    </Panel>}
    <Button label="Seleccionar objeto →" onPress={() => router.push({ pathname: '/selection', params: { reference: mode === 'Video' ? frame : 'image' } })} />
    <Button secondary label="Volver a captura" onPress={() => router.back()} />
  </ScreenContainer>;
}
