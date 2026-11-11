import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useSession } from '@/session/context';
import { useAppTheme } from '@/theme';
import { AssetGrid } from '@/components/assets/asset-card';
import { Button, Copy, EmptyState, IconButton, ScreenContainer } from '@/components/ui/kit';
export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, removeAsset, assets } = useSession();
  const project = projects.find(p => p.id === id);
  const [editing, setEditing] = useState(false);
  const { colors } = useAppTheme();
  if (!project) return <ScreenContainer title="Proyecto"><EmptyState title="Proyecto no encontrado" action="Ver proyectos" onPress={() => router.replace('/(tabs)/projects')} /></ScreenContainer>;
  const items = assets.filter(a => project.assetIds.includes(a.id));
  return <ScreenContainer title={project.name} action={items.length > 0 ? <IconButton label={editing ? 'Terminar edición' : 'Administrar assets'} onPress={() => setEditing(v => !v)}>{editing ? <Check size={22} color={colors.text} /> : <Pencil size={21} color={colors.text} />}</IconButton> : undefined}>
    <Copy tone="muted" size={13}>{items.length} assets · esta sesión</Copy>
    {items.length ? editing ? items.map(a => <View key={a.id} className="flex-row items-center gap-3 rounded-[24px] border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}><View className="flex-1"><Copy bold>{a.name}</Copy></View><Pressable accessibilityRole="button" accessibilityLabel={`Quitar ${a.name}`} onPress={() => removeAsset(project.id, a.id)} className="h-12 w-12 items-center justify-center"><Trash2 size={20} color={colors.danger} /></Pressable></View>) : <AssetGrid assets={items} /> : <EmptyState title="Aún no hay assets" action="Explorar catálogo" onPress={() => router.push('/results')} />}
    {items.length > 0 && <Button secondary label="Añadir assets" icon={Plus} onPress={() => router.push('/results')} />}
  </ScreenContainer>;
}
