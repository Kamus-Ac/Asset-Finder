import { useState } from 'react';
import { View, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Bookmark, Check, Plus, ChevronRight, Info, ExternalLink } from 'lucide-react-native';
import { useSession } from '@/session/context';
import { useAppTheme } from '@/theme';
import { message } from '@/services/http';
import AssetPreview from '@/components/assets/asset-preview';
import { Button, Choices, ConfirmationModal, Copy, EmptyState, Field, IconButton, Panel, ScreenContainer, StatusBadge } from '@/components/ui/kit';

export default function AssetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assets, projects, saveAsset, createProject } = useSession();
  const asset = assets.find(a => a.id === id);
  const { colors } = useAppTheme();
  const [view, setView] = useState('Principal');
  const [save, setSave] = useState(false);
  const [info, setInfo] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  if (!asset) return <ScreenContainer title="Asset"><EmptyState title="Modelo no disponible en esta sesión" action="Buscar modelos" onPress={() => router.replace('/results')} /></ScreenContainer>;
  const saved = projects.some(p => p.assetIds.includes(asset.id));
  async function open(url: string) { try { await Linking.openURL(url); } catch (cause) { setError(message(cause)); } }
  return <ScreenContainer title={asset.name} action={<IconButton label="Información del asset" onPress={() => setInfo(true)}><Info size={22} color={colors.text} /></IconButton>}>
    <AssetPreview asset={asset} height={300} variant={view} />
    <Choices values={['Principal', 'Detalle', 'Escala']} value={view} onChange={setView} />
    <View className="flex-row flex-wrap items-center justify-between gap-2"><Copy tone="muted" size={12}>{asset.source}</Copy><StatusBadge label={asset.available ? asset.format : 'Enlace externo'} /></View>
    {asset.score !== null && <Copy tone="muted" size={12}>Similitud: {asset.score.toFixed(3)} · orden de comparación</Copy>}
    {asset.sourceUrl && <Button label="Ver modelo en su origen" icon={ExternalLink} onPress={() => { void open(asset.sourceUrl!); }} />}
    {asset.available && asset.modelUrl && <Button secondary label="Abrir archivo del modelo" icon={ExternalLink} onPress={() => { void open(asset.modelUrl!); }} />}
    <Button secondary label={saved ? 'Guardado en proyectos' : 'Guardar en proyecto'} icon={saved ? Check : Bookmark} onPress={() => setSave(true)} />
    {error && <Copy tone="danger">{error}</Copy>}
    <Panel><Copy size={18}>Sobre este modelo</Copy><Copy tone="muted" size={13}>{asset.description}</Copy><Copy tone="muted" size={11}>Las vistas muestran la miniatura de la fuente. Las colecciones se guardan durante esta sesión.</Copy></Panel>
    <ConfirmationModal visible={save} title="Guardar en proyecto" onClose={() => { setSave(false); setCreating(false); }}>
      {projects.map(p => <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Guardar en ${p.name}`} onPress={() => { saveAsset(p.id, asset.id); setSave(false); }} className="min-h-14 flex-row items-center gap-3"><View className="flex-1"><Copy>{p.name}</Copy></View>{p.assetIds.includes(asset.id) ? <Check size={20} color={colors.accent} /> : <ChevronRight size={20} color={colors.muted} />}</Pressable>)}
      {creating ? <><Field value={name} onChange={setName} placeholder="Nombre del proyecto" autoFocus /><Button label="Crear y guardar" icon={Plus} disabled={!name.trim()} onPress={() => { const projectId = createProject(name.trim()); saveAsset(projectId, asset.id); setName(''); setCreating(false); setSave(false); }} /></> : <Button secondary label="Nuevo proyecto" icon={Plus} onPress={() => setCreating(true)} />}
    </ConfirmationModal>
    <ConfirmationModal visible={info} title="Información" onClose={() => setInfo(false)}><Panel><Copy bold>{asset.source}</Copy><Copy tone="muted">{asset.format}</Copy><Copy tone="muted" size={13}>Licencia: {asset.license}</Copy></Panel>{!asset.available && <Copy tone="muted" size={12}>La fuente no ha proporcionado un archivo 3D verificado para esta app.</Copy>}</ConfirmationModal>
  </ScreenContainer>;
}
