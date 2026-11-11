import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Check, Plus } from 'lucide-react-native';
import { Art, Button, Copy, Field, Panel, ScreenContainer, StatusBadge } from '@/components/ui/kit';
import { assets } from '@/mocks/catalog';
import { useDemoSession } from '@/mocks/session';
import { useAppTheme } from '@/theme';

export default function Environment() {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const { createProject, saveAsset } = useDemoSession();
  const { colors } = useAppTheme();

  function create() {
    if (!name.trim()) return;
    const id = createProject(name.trim());
    selected.forEach(assetId => saveAsset(id, assetId));
    router.replace({ pathname: '/projects/[id]', params: { id } });
  }

  return <ScreenContainer title="Crear entorno">
    <StatusBadge label="Vista previa local" />
    <Panel>
      <Field value={name} onChange={setName} placeholder="Nombre del entorno" />
      <Copy tone="muted" size={13}>Elige los assets de tu colección.</Copy>
    </Panel>
    <View className="flex-row flex-wrap gap-3">
      {assets.filter(asset => asset.available).map(asset => {
        const checked = selected.includes(asset.id);
        return <Pressable key={asset.id} accessibilityRole="checkbox" accessibilityLabel={asset.name} accessibilityState={{ checked }} onPress={() => setSelected(current => checked ? current.filter(id => id !== asset.id) : [...current, asset.id])} className="grow basis-[45%] gap-3 rounded-[20px] border p-3 active:opacity-70" style={{ backgroundColor: colors.surface, borderColor: checked ? colors.accent : colors.border }}>
          <Art kind={asset.kind} height={120} />
          <View className="flex-row items-center justify-between gap-2"><Copy size={13}>{asset.name}</Copy>{checked ? <Check size={18} color={colors.accent} /> : <Plus size={18} color={colors.muted} />}</View>
        </Pressable>;
      })}
    </View>
    <Button label="Crear entorno" disabled={!name.trim()} onPress={create} />
  </ScreenContainer>;
}
