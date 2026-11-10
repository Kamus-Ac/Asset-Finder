import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { pickMedia, readPickerResult, type LocalMedia, type MediaAction } from './picker';

type MediaIssue = { message: string; settings?: boolean };
type MediaState = {
  media: LocalMedia | null;
  busy: boolean;
  issue: MediaIssue | null;
  choose: (action: MediaAction) => Promise<boolean>;
  clearIssue: () => void;
};
const Context = createContext<MediaState | null>(null);
export function MediaProvider({ children }: { children: ReactNode }) {
  const [media, setMedia] = useState<LocalMedia | null>(null);
  const [busy, setBusy] = useState(false);
  const [issue, setIssue] = useState<MediaIssue | null>(null);
  const pending = useRef(false);
  const interacted = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let active = true;
    // Recover the result if Android recreated the activity during capture.
    ImagePicker.getPendingResultAsync().then(result => {
      if (!active || !result || interacted.current) return;
      if ('code' in result) { setIssue({ message: 'No se pudo recuperar la captura. Inténtalo de nuevo.' }); return; }
      const outcome = readPickerResult(result);
      if (outcome.status === 'selected') setMedia(outcome.media);
    }).catch(() => { if (active && !interacted.current) setIssue({ message: 'No se pudo recuperar la captura.' }); });
    return () => { active = false; };
  }, []);

  async function choose(action: MediaAction) {
    if (pending.current) return false;
    pending.current = true;
    interacted.current = true;
    setBusy(true);
    setIssue(null);
    try {
      const outcome = await pickMedia(action);
      if (outcome.status === 'denied') {
        setIssue({ message: 'Permite el acceso a la cámara para continuar.', settings: !outcome.canAskAgain });
        return false;
      }
      if (outcome.status === 'cancelled') return false;
      setMedia(outcome.media);
      return true;
    } catch {
      setIssue({ message: action === 'library' ? 'No se pudo abrir la imagen. Inténtalo de nuevo.' : 'No se pudo abrir la cámara. Revisa sus permisos e inténtalo de nuevo.', settings: action !== 'library' && Platform.OS !== 'web' });
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return <Context value={{ media, busy, issue, choose, clearIssue: () => setIssue(null) }}>{children}</Context>;
}
export function useMedia() {
  const value = use(Context);
  if (!value) throw new Error('MediaProvider missing');
  return value;
}
