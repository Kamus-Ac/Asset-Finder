import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Check, Plus } from 'lucide-react-native';
import { Art, Button, Copy, Field, Panel, ScreenContainer, SculpturePanel, SectionHeader } from '@/components/ui/kit';
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
    <SculpturePanel title={'Da forma a\ntu entorno.'} caption="Colección local · vista previa" />
    <Panel><Field value={name} onChange={setName} placeholder="Nombre del entorno" /></Panel>
    <View className="flex-row items-center justify-between gap-3"><SectionHeader title="Elige tus assets" /><Copy size={11} tone="muted">{selected.length} seleccionados</Copy></View>
    <View className="flex-row flex-wrap gap-3">
      {assets.filter(asset => asset.available).map(asset => {
        const checked = selected.includes(asset.id);
        return <Pressable key={asset.id} accessibilityRole="checkbox" accessibilityLabel={asset.name} accessibilityState={{ checked }} aria-checked={checked} onPress={() => setSelected(current => checked ? current.filter(id => id !== asset.id) : [...current, asset.id])} className="grow basis-[45%] gap-3 rounded-[24px] border p-2 active:opacity-70" style={{ backgroundColor: colors.surface, borderColor: checked ? colors.accent : colors.border }}>
          <Art kind={asset.kind} height={120} />
          <View className="flex-row items-center justify-between gap-2 px-2 pb-2"><View className="flex-1"><Copy size={12}>{asset.name}</Copy></View><View className="h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: checked ? colors.soft : colors.input }}>{checked ? <Check size={14} color={colors.accent} /> : <Plus size={14} color={colors.muted} />}</View></View>
        </Pressable>;
      })}
    </View>
    <Button label="Crear entorno" disabled={!name.trim()} onPress={create} />
  </ScreenContainer>;
}
