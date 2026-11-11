import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, Video, ImagePlus } from 'lucide-react-native';
import { Button, Choices, ScreenContainer, SculpturePanel } from '@/components/ui/kit';
import MediaFeedback from '@/components/media-feedback';
import { useMedia } from '@/media/context';
import type { MediaAction } from '@/media/picker';

export default function CaptureScreen({ tab = false }: { tab?: boolean }) {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState(params.mode === 'video' ? 'Video' : 'Foto');
  const { busy, choose } = useMedia();
  const Icon = mode === 'Video' ? Video : Camera;
  async function open(action: MediaAction) {
    if (await choose(action)) {
      if (tab) router.push('/reference');
      else router.replace('/reference');
    }
  }
  return <ScreenContainer title="Capturar" tab={tab}>
    <MediaFeedback />
    <SculpturePanel variant="ribbon" title={mode === 'Video' ? 'Una nueva\nperspectiva.' : 'Todo empieza\ncon una imagen.'} caption={mode === 'Video' ? 'Video de referencia' : 'Foto de referencia'} />
    <Choices values={['Foto', 'Video']} value={mode} onChange={setMode} />
    <Button label={busy ? 'Abriendo…' : 'Abrir cámara'} disabled={busy} icon={Icon} onPress={() => { void open(mode === 'Video' ? 'video' : 'photo'); }} />
    <Button secondary label="Seleccionar foto" disabled={busy} icon={ImagePlus} onPress={() => { void open('library'); }} />
  </ScreenContainer>;
}
