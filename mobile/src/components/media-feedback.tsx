import { Linking } from 'react-native';
import { Settings2 } from 'lucide-react-native';
import { Button, ConfirmationModal, Copy } from '@/components/ui/kit';
import { useMedia } from '@/media/context';

export default function MediaFeedback() {
  const { issue, clearIssue } = useMedia();
  return <ConfirmationModal visible={issue !== null} title="Acceso a medios" onClose={clearIssue}>
    <Copy>{issue?.message}</Copy>
    {issue?.settings && <Button label="Abrir ajustes" icon={Settings2} onPress={() => { void Linking.openSettings().catch(() => {}); }} />}
    <Button secondary label="Cerrar" onPress={clearIssue} />
  </ConfirmationModal>;
}
