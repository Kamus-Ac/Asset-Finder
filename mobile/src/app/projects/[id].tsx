import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AssetGrid } from '@/components/assets/asset-card';
import { AppHeader, Button, ConfirmationModal, Copy, DemoNotice, EmptyState, Panel, ScreenContainer, StatusBadge } from '@/components/ui/kit';
import { assets } from '@/mocks/catalog';
import { useDemoSession } from '@/mocks/session';
export default function ProjectDetail() {
  const { projects, removeAsset } = useDemoSession();
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const project = projects.find(p => p.id === id);
  const [manage, setManage] = useState(false);
  if (!project)
    return <ScreenContainer title="Proyecto no encontrado">
      <EmptyState title="Esta colección no está disponible" description="El proyecto no existe o pertenecía a una sesión anterior. Vuelve a las colecciones de ejemplo." action="Volver a proyectos" onPress={() => router.replace('/(tabs)/projects')} />
    </ScreenContainer>;
  const selected = assets.filter(a => project.assetIds.includes(a.id));
  return <ScreenContainer title="Detalle del proyecto">
    <StatusBadge label="COLECCIÓN · DEMO" />
    <AppHeader title={project.name} subtitle={project.description} />
    <DemoNotice text="Los cambios de esta pantalla son temporales. No hay sincronización ni persistencia." />
    <Panel>
      <Copy bold>{selected.length} assets en tu colección</Copy>
      <Copy tone="muted">{project.updated}</Copy>
      <Copy tone="muted">Preparado para el concepto de escena web compartida. La integración está pendiente.</Copy>
    </Panel>
    {selected.length ? <AssetGrid assets={selected} /> : <EmptyState action="Explorar ejemplos" onPress={() => router.push('/results')} />}<Button label="Añadir desde el catálogo demo" onPress={() => router.push('/results')} />
    <Button secondary label="Administrar colección" onPress={() => setManage(true)} />
    <ConfirmationModal visible={manage} title="Administrar · demo" onClose={() => setManage(false)}>
      <Copy tone="muted">Quitar modifica solo la colección demo durante esta sesión.</Copy>{selected.map(a => <Button key={a.id} secondary label={`Quitar ${a.name}`} onPress={() => removeAsset(project.id, a.id)} />)}</ConfirmationModal>
  </ScreenContainer>;
}
