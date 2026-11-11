import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Bookmark, Check, Plus, ChevronRight, Info, Box } from 'lucide-react-native';
import { assets } from '@/mocks/catalog';
import { useDemoSession } from '@/mocks/session';
import { useAppTheme } from '@/theme';
import { Art, Button, Choices, ConfirmationModal, Copy, EmptyState, Field, IconButton, Panel, ScreenContainer, StatusBadge } from '@/components/ui/kit';
export default function AssetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = assets.find(a => a.id === id);
  const { projects, saveAsset, createProject } = useDemoSession();
  const { colors } = useAppTheme();
  const [view, setView] = useState('Principal');
  const [save, setSave] = useState(false);
  const [info, setInfo] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  if (!asset) return <ScreenContainer title="Asset"><EmptyState title="Asset no encontrado" action="Ver catálogo" onPress={() => router.replace('/results')} /></ScreenContainer>;
  const saved = projects.some(p => p.assetIds.includes(asset.id));
  return <ScreenContainer title={asset.name} action={<IconButton label="Información del asset" onPress={() => setInfo(true)}><Info size={22} color={colors.text} /></IconButton>}>
    <Art kind={asset.kind} height={300} variant={view} />
    <Choices values={['Principal', 'Detalle', 'Escala']} value={view} onChange={setView} />
    <View className="flex-row flex-wrap items-center justify-between gap-2"><Copy tone="muted" size={12}>{asset.source}</Copy><StatusBadge label={asset.available ? asset.format : 'Referencia'} /></View>
    <Button label={saved ? 'Guardado en proyectos' : 'Guardar en proyecto'} icon={saved ? Check : Bookmark} onPress={() => setSave(true)} />
    {!asset.available && <Button secondary label="Reconstruir" icon={Box} onPress={() => router.push('/reconstruction')} />}
    <Panel><Copy size={18}>Sobre este asset</Copy><Copy tone="muted" size={13}>{asset.description}</Copy><Copy tone="muted" size={11}>Asset de ejemplo · sin descarga</Copy></Panel>
    <ConfirmationModal visible={save} title="Guardar en proyecto" onClose={() => { setSave(false); setCreating(false); }}>
      {projects.map(p => <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Guardar en ${p.name}`} onPress={() => { saveAsset(p.id, asset.id); setSave(false); }} className="min-h-14 flex-row items-center gap-3"><View className="flex-1"><Copy>{p.name}</Copy></View>{p.assetIds.includes(asset.id) ? <Check size={20} color={colors.accent} /> : <ChevronRight size={20} color={colors.muted} />}</Pressable>)}
      {creating ? <><Field value={name} onChange={setName} placeholder="Nombre del proyecto" autoFocus /><Button label="Crear y guardar" icon={Plus} disabled={!name.trim()} onPress={() => { const projectId = createProject(name.trim()); saveAsset(projectId, asset.id); setName(''); setCreating(false); setSave(false); }} /></> : <Button secondary label="Nuevo proyecto" icon={Plus} onPress={() => setCreating(true)} />}
    </ConfirmationModal>
    <ConfirmationModal visible={info} title="Información" onClose={() => setInfo(false)}>
      <Panel><Copy bold>{asset.source}</Copy><Copy tone="muted">{asset.format}</Copy><Copy tone="muted" size={13}>{asset.license}</Copy></Panel>
      <Copy tone="muted" size={12}>Ilustración local · licencia sin verificar</Copy>
    </ConfirmationModal>
  </ScreenContainer>;
}
