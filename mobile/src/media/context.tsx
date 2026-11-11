import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { pickMedia, readPickerResult, type LocalMedia, type MediaAction } from './picker';
import { prepareUpload } from './prepare';
import { uploadMedia } from '@/services/media';
import { message } from '@/services/http';
import type { RemoteMedia } from '@/services/contracts';

type MediaIssue = { message: string; settings?: boolean };
type MediaState = {
  media: LocalMedia | null;
  busy: boolean;
  issue: MediaIssue | null;
  reference: RemoteMedia | null;
  uploading: boolean;
  uploadError: string | null;
  upload: () => Promise<RemoteMedia | null>;
  cancelUpload: () => void;
  choose: (action: MediaAction) => Promise<boolean>;
  clearIssue: () => void;
};
const Context = createContext<MediaState | null>(null);
export function MediaProvider({ children }: { children: ReactNode }) {
  const [media, setMedia] = useState<LocalMedia | null>(null);
  const [busy, setBusy] = useState(false);
  const [issue, setIssue] = useState<MediaIssue | null>(null);
  const [reference, setReference] = useState<RemoteMedia | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const pending = useRef(false);
  const interacted = useRef(false);
  const currentMedia = useRef<LocalMedia | null>(null);
  const cachedReference = useRef<RemoteMedia | null>(null);
  const uploadController = useRef<AbortController | null>(null);
  const select = useCallback((value: LocalMedia) => {
    uploadController.current?.abort(); uploadController.current = null;
    currentMedia.current = value; cachedReference.current = null;
    setMedia(value); setReference(null); setUploading(false); setUploadError(null);
  }, []);

  useEffect(() => () => uploadController.current?.abort(), []);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let active = true;
    ImagePicker.getPendingResultAsync().then(result => {
      if (!active || !result || interacted.current) return;
      if ('code' in result) { setIssue({ message: 'No se pudo recuperar la captura. Inténtalo de nuevo.' }); return; }
      const outcome = readPickerResult(result);
      if (outcome.status === 'selected') select(outcome.media);
    }).catch(() => { if (active && !interacted.current) setIssue({ message: 'No se pudo recuperar la captura.' }); });
    return () => { active = false; };
  }, [select]);

  const cancelUpload = useCallback(() => { uploadController.current?.abort(); uploadController.current = null; setUploading(false); }, []);
  async function upload() {
    if (cachedReference.current) return cachedReference.current;
    const selected = currentMedia.current;
    if (!selected || uploadController.current) return null;
    const controller = new AbortController();
    uploadController.current = controller; setUploading(true); setUploadError(null);
    try {
      const form = await prepareUpload(selected);
      if (controller.signal.aborted) return null;
      const result = await uploadMedia(form, controller.signal);
      if (controller.signal.aborted || currentMedia.current !== selected) return null;
      cachedReference.current = result; setReference(result); return result;
    } catch (error) {
      if (!controller.signal.aborted) setUploadError(message(error));
      return null;
    } finally {
      if (uploadController.current === controller) { uploadController.current = null; setUploading(false); }
    }
  }
  async function choose(action: MediaAction) {
    if (pending.current) return false;
    pending.current = true; interacted.current = true; setBusy(true); setIssue(null);
    try {
      const outcome = await pickMedia(action);
      if (outcome.status === 'denied') { setIssue({ message: 'Permite el acceso a la cámara para continuar.', settings: !outcome.canAskAgain }); return false; }
      if (outcome.status === 'cancelled') return false;
      select(outcome.media); return true;
    } catch {
      setIssue({ message: action === 'library' ? 'No se pudo abrir la imagen. Inténtalo de nuevo.' : 'No se pudo abrir la cámara. Revisa sus permisos e inténtalo de nuevo.', settings: action !== 'library' && Platform.OS !== 'web' });
      return false;
    } finally { pending.current = false; setBusy(false); }
  }
  return <Context value={{ media, busy, issue, reference, uploading, uploadError, upload, cancelUpload, choose, clearIssue: () => setIssue(null) }}>{children}</Context>;
}
export function useMedia() { const value = use(Context); if (!value) throw new Error('MediaProvider missing'); return value; }
