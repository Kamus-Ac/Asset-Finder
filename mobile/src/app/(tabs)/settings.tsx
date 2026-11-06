import { useState } from 'react';
import { AppHeader, Button, Choices, ConfirmationModal, Copy, Panel, ScreenContainer, StatusBadge } from '@/components/ui/kit';
import { useAppTheme, type Appearance } from '@/theme';
import { connection } from '@/services/contracts';
import app from '../../../app.json';
const names: Record<Appearance, string> = { system: 'Sistema', light: 'Claro', dark: 'Oscuro' };
export default function Settings() {
  const { appearance, setAppearance } = useAppTheme();
  const [info, setInfo] = useState(false);
  return <ScreenContainer title="Ajustes" tab>
    <AppHeader eyebrow="A tu manera" title="Tu espacio de trabajo" subtitle="Una base sencilla para tus próximas ideas." />
    <Panel>
      <Copy bold size={20}>Apariencia</Copy>
      <Choices values={['Sistema', 'Claro', 'Oscuro']} value={names[appearance]} onChange={v => setAppearance((Object.keys(names) as Appearance[]).find(k => names[k] === v) ?? 'system')} />
      <Copy tone="muted" size={12}>Preferencia local durante esta sesión. El modo Sistema sigue al dispositivo.</Copy>
    </Panel>
    <Panel>
      <Copy bold size={20}>Conectividad</Copy>
      <StatusBadge label={connection.configured ? 'Configurada' : 'No configurada'} />
      <Copy tone="muted">No hay una URL de backend ni una conexión verificada. La configuración de FastAPI y Tailscale se incorporará más adelante.</Copy>
      <Button label="Comprobar conexión · próximamente" disabled />
    </Panel>
    <Panel>
      <Copy bold size={20}>Asset Finder Mobile</Copy>
      <Copy tone="muted">Versión {app.expo.version} · Prototipo visual</Copy>
      <Copy tone="muted">Búsqueda visual de recursos 3D para tus proyectos.</Copy>
      <Button secondary label="Acerca del proyecto" onPress={() => setInfo(true)} />
    </Panel>
    <Panel>
      <Copy bold size={20}>Próximas preferencias</Copy>
      <Copy tone="muted">Calidad de carga · formatos · sincronización</Copy>
      <Button secondary label="Disponibles tras la integración" disabled />
    </Panel>
    <ConfirmationModal visible={info} title="Una referencia, muchas posibilidades" onClose={() => setInfo(false)}>
      <Copy>Asset Finder conecta la captura móvil con la exploración de assets y la creación de escenas web.</Copy>
      <Copy tone="muted">Este prototipo utiliza exclusivamente ejemplos locales. SAM 2, DINOv2 y la posible reconstrucción con SAM 3D Objects no están conectados.</Copy>
    </ConfirmationModal>
  </ScreenContainer>;
}
