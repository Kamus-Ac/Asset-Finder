import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AssetGrid } from '@/components/assets/asset-card';
import { AppHeader, Art, Button, Choices, ConfirmationModal, Copy, DemoNotice, EmptyState, Panel, Row, ScreenContainer, StatusBadge } from '@/components/ui/kit';
import { assets } from '@/mocks/catalog';
import { useDemoSession } from '@/mocks/session';
export default function AssetDetail() {
  const { projects, saveAsset } = useDemoSession();
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const asset = assets.find(a => a.id === id);
  const [view, setView] = useState('Principal');
  const [modal, setModal] = useState<'save' | 'source' | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  if (!asset)
    return <ScreenContainer title="Asset no encontrado">
      <EmptyState title="Este ejemplo no existe" description="Vuelve al catálogo para elegir un modelo." action="Ver catálogo" onPress={() => router.replace('/results')} />
    </ScreenContainer>;
  return <ScreenContainer title="Detalle del asset">
    <StatusBadge label={asset.available ? 'ARCHIVO 3D · EJEMPLO' : 'SOLO REFERENCIA'} />
    <Panel>
      <Art kind={asset.kind} height={290} variant={view} />
      <Row>{['Principal', 'Detalle', 'Escala'].map(v => <Pressable key={v} accessibilityRole="button" accessibilityLabel={`Ver ${v}`} accessibilityState={{ selected: view === v }} onPress={() => setView(v)} style={({ pressed }) => ({ flex: 1, opacity: pressed ? .6 : 1 })}>
        <View>
          <Art kind={asset.kind} height={70} variant={v} />
        </View>
      </Pressable>)}</Row>
      <Choices values={['Principal', 'Detalle', 'Escala']} value={view} onChange={setView} />
      <Copy tone="muted" size={12}>{view === 'Principal' ? 'Ilustración principal.' : view === 'Detalle' ? 'Acercamiento de la ilustración local.' : 'Vista reducida ilustrativa, sin dimensiones verificadas.'} Galería ilustrada; sin visor 3D.</Copy>
    </Panel>
    <AppHeader title={asset.name} subtitle={asset.source} />
    <Copy>{asset.description}</Copy>
    <DemoNotice />
    <Panel>
      <Copy bold>Información del recurso</Copy>
      <Copy tone="muted">Formato: {asset.format}</Copy>
      <Copy tone="muted">Licencia: {asset.license}</Copy>
      <Copy tone="muted">Ranking: {asset.score.toFixed(2)} · dato de demostración</Copy>
      <Copy tone={asset.available ? 'success' : 'muted'}>{asset.available ? 'Representa un asset con archivo; este prototipo no incluye el archivo.' : 'Solo enlace de referencia; no hay archivo 3D disponible.'}</Copy>
    </Panel>
    <Button label={saved ? `Guardado localmente en ${saved}` : 'Guardar en un proyecto'} onPress={() => setModal('save')} />
    <Button secondary label="Consultar fuente · vista previa" onPress={() => setModal('source')} />
    <Panel>
      <Copy bold>De tu móvil a la escena web</Copy>
      <Copy tone="muted">Los formatos GLB podrán incorporarse a la escena web tras validar materiales, escala y licencia. Sin sincronización en esta versión.</Copy>
    </Panel>
    <ConfirmationModal visible={modal !== null} title={modal === 'save' ? 'Elegir proyecto · demo' : 'Fuente de ejemplo'} onClose={() => setModal(null)}>{modal === 'save' ? <>
      <DemoNotice text="Se añade a la colección local durante esta sesión. No hay persistencia ni sincronización." />{projects.map(p => <Button key={p.id} secondary label={p.name} onPress={() => { saveAsset(p.id, asset.id); setSaved(p.name); setModal(null); }} />)}</> : <Copy tone="muted">{asset.source} es una fuente ficticia. La versión integrada mostrará aquí el enlace verificado y abrirá el catálogo externo.</Copy>}</ConfirmationModal>
    <Copy bold size={20}>Más para explorar</Copy>
    <AssetGrid assets={assets.filter(a => a.id !== id).slice(0, 2)} />
  </ScreenContainer>;
}
