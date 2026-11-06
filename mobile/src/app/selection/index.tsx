import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Art, Button, Choices, Copy, DemoNotice, Panel, ScreenContainer, StatusBadge } from '@/components/ui/kit';
import { useAppTheme } from '@/theme';
export default function Selection() {
  const [tool, setTool] = useState('Rectángulo');
  const [selected, setSelected] = useState(true);
  const [mask, setMask] = useState(false);
  const { colors } = useAppTheme();
  return <ScreenContainer title="Seleccionar objeto">
    <AppHeader eyebrow="02 / Objeto" title="Quédate con lo esencial" subtitle="La selección indica qué objeto buscar en los catálogos." />
    <DemoNotice text="Selección ilustrativa fija. No se calculan coordenadas ni máscaras de SAM." />
    <View style={{ backgroundColor: colors.stage, borderRadius: 24, padding: 18 }}>
      <Art height={340} />{selected && <View pointerEvents="none" style={{ position: 'absolute', left: '27%', top: 65, width: '46%', height: 255, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.accent, borderRadius: 18, backgroundColor: mask ? colors.accent + '33' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{tool !== 'Rectángulo' && <StatusBadge label={tool === 'Punto +' ? '+ Punto demo' : '− Punto demo'} />}</View>}</View>
    <Choices values={['Rectángulo', 'Punto +', 'Punto −']} value={tool} onChange={setTool} />
    <Panel>
      <Copy bold>Selección de ejemplo</Copy>
      <Copy tone="muted">Los puntos y el rectángulo representan las herramientas futuras. La superposición es una guía visual, no una máscara calculada.</Copy>
      <Button secondary label={mask ? 'Ocultar guía de máscara' : 'Ver guía de máscara · demo'} disabled={!selected} onPress={() => setMask(!mask)} />
      <Button secondary label={selected ? 'Reiniciar selección' : 'Restaurar selección de ejemplo'} onPress={() => { setSelected(!selected); setMask(false); }} />
    </Panel>
    <Button disabled={!selected} label="Confirmar y ver modelos similares" onPress={() => router.push('/results')} />
    <Button secondary label="Ver opción de reconstrucción 3D" onPress={() => router.push('/reconstruction')} />
  </ScreenContainer>;
}
