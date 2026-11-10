import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { RotateCcw, Search } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useMedia } from '@/media/context';
import { Button, Choices, Copy, EmptyState, IconButton, ScreenContainer, StatusBadge } from '@/components/ui/kit';

export default function Selection() {
  const { media } = useMedia();
  const [tool, setTool] = useState('Rectángulo');
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [center, setCenter] = useState({ x: 50, y: 50 });
  const [width, setWidth] = useState(1);
  const reset = () => { setPoints([]); setCenter({ x: 50, y: 50 }); };
  if (!media || media.type !== 'image') return <ScreenContainer title="Seleccionar"><EmptyState title="Selecciona una imagen" action="Elegir referencia" onPress={() => router.replace('/reference')} /></ScreenContainer>;
  return <ScreenContainer title="Seleccionar" action={<IconButton label="Reiniciar selección" onPress={reset}><RotateCcw size={21} color="#FFFFFF" /></IconButton>}>
    <StatusBadge label="Selección de ejemplo" />
    <Pressable accessibilityRole="button" accessibilityLabel="Toca para ubicar la selección o añadir puntos" onLayout={e => setWidth(e.nativeEvent.layout.width)} onPress={e => {
      const { locationX, locationY } = e.nativeEvent;
      const point = { x: Math.max(2, Math.min(98, locationX / width * 100)), y: Math.max(2, Math.min(98, locationY / 320 * 100)) };
      if (tool === 'Puntos') setPoints(current => [...current, point]);
      else setCenter({ x: Math.max(27, Math.min(73, point.x)), y: Math.max(32, Math.min(68, point.y)) });
    }} className="overflow-hidden rounded-[20px]">
      <View pointerEvents="none" className="bg-black/20"><Image source={{ uri: media.uri }} accessibilityLabel="Imagen seleccionada" style={{ width: '100%', height: 320 }} contentFit="contain" /></View>
      <View pointerEvents="none" className="absolute inset-0">
        {tool !== 'Puntos' && <View className="absolute rounded-[16px] border-2 border-[#CD0EEA]" style={{ left: `${center.x - 25}%`, top: `${center.y - 30}%`, width: '50%', height: '60%', backgroundColor: tool === 'Máscara' ? '#CD0EEA44' : 'transparent' }} />}
        {tool === 'Puntos' && points.map((p, i) => <View key={i} className="absolute h-4 w-4 rounded-full border-2 border-white bg-[#CD0EEA]" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: [{ translateX: -8 }, { translateY: -8 }] }} />)}
      </View>
    </Pressable>
    <Choices values={['Rectángulo', 'Puntos', 'Máscara']} value={tool} onChange={setTool} />
    <Copy tone="muted" size={13}>{tool === 'Puntos' ? `${points.length} puntos · toca para añadir` : tool === 'Máscara' ? 'Máscara ilustrativa' : 'Toca para mover el área'}</Copy>
    <Button label="Buscar similares" icon={Search} disabled={tool === 'Puntos' && points.length < 1} onPress={() => router.push('/results')} />
  </ScreenContainer>;
}
