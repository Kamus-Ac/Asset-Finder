import { useState } from 'react';
import { AppHeader, Art, Button, Choices, Copy, DemoNotice, Panel, ScreenContainer, StatusBadge } from '@/components/ui/kit';
import { reconstructionScenarios as states } from '@/mocks/scenarios';
export default function Reconstruction() {
  const [state, setState] = useState<keyof typeof states>('No disponible');
  return <ScreenContainer title="Reconstrucción 3D">
    <AppHeader eyebrow="Exploración futura" title="Una nueva dimensión" subtitle="De una referencia visual a un posible objeto 3D." />
    <Panel>
      <Art height={235} />
      <StatusBadge label="SERVICIO NO HABILITADO" />
    </Panel>
    <DemoNotice text="Selector de estados de demostración. Cambiar esta vista no crea trabajos ni ejecuta modelos." />
    <Choices values={Object.keys(states) as (keyof typeof states)[]} value={state} onChange={setState} />
    <Panel>
      <Copy size={22} bold>{states[state][0]}</Copy>
      <Copy tone="muted">{states[state][1]}</Copy>
    </Panel>
    <Button label="Solicitar reconstrucción · no disponible" disabled />
    <Copy tone="muted" size={12}>Disponibilidad, calidad de geometría, tiempos y compatibilidad deberán verificarse antes de habilitar esta función.</Copy>
  </ScreenContainer>;
}
