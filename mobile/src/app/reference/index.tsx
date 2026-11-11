import { useState } from 'react';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { ScanLine, Camera, ImagePlus, Video } from 'lucide-react-native';
import { View } from 'react-native';
import { Button, Copy, EmptyState, ScreenContainer, StatusBadge } from '@/components/ui/kit';
import MediaFeedback from '@/components/media-feedback';
import LocalVideo from '@/components/local-video';
import { useMedia } from '@/media/context';
import type { MediaAction } from '@/media/picker';
import { useAppTheme } from '@/theme';
export default function Reference() {
  const { media, choose, busy } = useMedia();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const { colors } = useAppTheme();
  const video = media?.type === 'video';
  async function change(action: MediaAction) { await choose(action); }
  return <ScreenContainer title={video ? 'Video' : 'Referencia'}>
    <MediaFeedback />
    {!media ? <EmptyState title="Elige una referencia" /> : <>
      {video ? <LocalVideo key={media.uri} uri={media.uri} /> : <View className="overflow-hidden rounded-[28px] border" style={{ backgroundColor: colors.input, borderColor: colors.border }}><Image source={{ uri: media.uri }} accessibilityLabel="Imagen de referencia seleccionada" style={{ width: '100%', height: 320 }} contentFit="contain" onError={() => setFailedUri(media.uri)} />{failedUri === media.uri && <View className="p-4"><Copy tone="danger">No se pudo cargar esta imagen.</Copy></View>}</View>}
      <StatusBadge label={video ? 'Video local' : 'Imagen de referencia'} />
      <Copy tone="muted" size={12}>{media.name}</Copy>
      {video ? <View className="flex-row items-center gap-3"><Video size={18} color={colors.muted} /><Copy tone="muted" size={13}>Selección de fotogramas próximamente</Copy></View> : <Button label="Seleccionar objeto" disabled={failedUri === media.uri} icon={ScanLine} onPress={() => router.push('/selection')} />}
    </>}
    <Button secondary label="Seleccionar otra foto" disabled={busy} icon={ImagePlus} onPress={() => { void change('library'); }} />
    <Button secondary label={video ? 'Grabar de nuevo' : 'Tomar foto'} disabled={busy} icon={Camera} onPress={() => { void change(video ? 'video' : 'photo'); }} />
  </ScreenContainer>;
}
