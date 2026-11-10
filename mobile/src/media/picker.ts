import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type MediaAction = 'photo' | 'video' | 'library';
export type LocalMedia = {
  uri: string;
  type: 'image' | 'video';
  name: string;
  width: number;
  height: number;
  duration?: number | null;
};
export type PickOutcome =
  | { status: 'selected'; media: LocalMedia }
  | { status: 'cancelled' }
  | { status: 'denied'; canAskAgain: boolean };

export function readPickerResult(result: ImagePicker.ImagePickerResult, action?: MediaAction): PickOutcome {
  if (result.canceled || !result.assets?.length) return { status: 'cancelled' };
  const asset = result.assets[0];
  if (!asset.uri) throw new Error('El archivo no está disponible.');
  const type = asset.type === 'video' || (asset.type == null && action === 'video') ? 'video' : 'image';
  return { status: 'selected', media: {
    uri: asset.uri, type, name: asset.fileName ?? (type === 'video' ? 'Video grabado' : 'Imagen'),
    width: asset.width, height: asset.height, duration: asset.duration,
  } };
}

export async function pickMedia(action: MediaAction): Promise<PickOutcome> {
  if (action === 'library') {
    // The system photo picker grants access only to the chosen image.
    return readPickerResult(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1 }), action);
  }
  // On web, keep the launch in the button's activation call stack.
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { status: 'denied', canAskAgain: permission.canAskAgain };
  }
  return readPickerResult(await ImagePicker.launchCameraAsync({
    mediaTypes: action === 'video' ? ['videos'] : ['images'],
    allowsEditing: false, quality: 1, videoMaxDuration: 60,
  }), action);
}
