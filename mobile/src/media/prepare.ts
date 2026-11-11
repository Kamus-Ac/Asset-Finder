import { Platform } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { LocalMedia } from './picker';

export async function prepareUpload(media: LocalMedia): Promise<FormData> {
  if (media.type !== 'image') throw new Error('El servidor todavía no admite videos. Selecciona una imagen.');
  const context = ImageManipulator.manipulate(media.uri);
  let rendered;
  try {
    if (Math.max(media.width, media.height) > 1024) context.resize(media.width >= media.height ? { width: 1024 } : { height: 1024 });
    rendered = await context.renderAsync();
    const image = await rendered.saveAsync({ format: SaveFormat.PNG });
    const form = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(image.uri)).blob();
      form.append('file', blob, 'referencia.png');
    } else {
      form.append('file', { uri: image.uri, type: 'image/png', name: 'referencia.png' } as unknown as Blob);
    }
    return form;
  } finally { rendered?.release(); context.release(); }
}
