import { router } from 'expo-router';
import { Box } from 'lucide-react-native';
import { Button, Copy, Panel, ScreenContainer, SculpturePanel, StatusBadge } from '@/components/ui/kit';

export default function Reconstruction() {
  return <ScreenContainer title="Reconstrucción">
    <SculpturePanel title={'De referencia\na nueva forma.'} caption="Reconstrucción 3D" />
    <Panel><StatusBadge label="Servicio no disponible" /><Copy tone="muted" size={13}>El backend todavía no ofrece generación de modelos 3D.</Copy><Button label="Generar modelo 3D" icon={Box} disabled /><Button secondary label="Buscar modelos existentes" onPress={() => router.push('/results')} /></Panel>
  </ScreenContainer>;
}
