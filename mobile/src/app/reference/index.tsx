import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { ScanLine, Camera, ImagePlus } from 'lucide-react-native';
import { View } from 'react-native';
import { Button, Copy, EmptyState, Panel, ScreenContainer, StatusBadge } from '@/components/ui/kit';
import MediaFeedback from '@/components/media-feedback';
import LocalVideo from '@/components/local-video';
import { useMedia } from '@/media/context';
import { useAppTheme } from '@/theme';

export default function Reference() {
  const { media, choose, busy, upload, uploading, uploadError, cancelUpload, reference } = useMedia();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const { colors } = useAppTheme();
  const video = media?.type === 'video';
  useEffect(() => () => cancelUpload(), [cancelUpload]);
  async function select() { if (await upload()) router.push('/selection'); }
  return <ScreenContainer title={video ? 'Video' : 'Referencia'}>
    <MediaFeedback />
    {!media ? <EmptyState title="Elige una referencia" /> : <>
      {video ? <LocalVideo key={media.uri} uri={media.uri} /> : <View className="overflow-hidden rounded-[28px] border" style={{ backgroundColor: colors.input, borderColor: colors.border }}><Image source={{ uri: media.uri }} accessibilityLabel="Imagen de referencia seleccionada" style={{ width: '100%', height: 320 }} contentFit="contain" onError={() => setFailedUri(media.uri)} />{failedUri === media.uri && <View className="p-4"><Copy tone="danger">No se pudo cargar esta imagen.</Copy></View>}</View>}
      <StatusBadge label={video ? 'Video local' : reference ? 'Referencia en el servidor' : 'Imagen local'} />
      <Copy tone="muted" size={12}>{media.name}</Copy>
      {video ? <Panel><Copy tone="muted" size={13}>El servidor todavía no admite video ni selección de fotogramas.</Copy></Panel> : <>
        <Button label={uploading ? 'Enviando imagen…' : reference ? 'Seleccionar objeto' : 'Enviar y seleccionar objeto'} disabled={busy || uploading || failedUri === media.uri} icon={ScanLine} onPress={() => { void select(); }} />
        {!reference && <Copy tone="muted" size={11}>Se enviará una copia de hasta 1024 px al servidor para analizarla.</Copy>}
      </>}
    </>}
    {uploadError && <Panel><Copy tone="danger">{uploadError}</Copy><Copy tone="muted" size={12}>Tu imagen sigue disponible. Puedes volver a enviarla.</Copy></Panel>}
    {uploading && <Button secondary label="Cancelar envío" onPress={cancelUpload} />}
    <Button secondary label="Seleccionar otra foto" disabled={busy || uploading} icon={ImagePlus} onPress={() => { void choose('library'); }} />
    <Button secondary label={video ? 'Grabar de nuevo' : 'Tomar foto'} disabled={busy || uploading} icon={Camera} onPress={() => { void choose(video ? 'video' : 'photo'); }} />
  </ScreenContainer>;
}
