import { useState } from 'react';
import { Plus } from 'lucide-react-native';
import { Button, ConfirmationModal, EmptyState, Field, IconButton, ScreenContainer, SculpturePanel, SectionHeader } from '@/components/ui/kit';
import { ProjectCard } from '@/components/projects/project-card';
import { useDemoSession } from '@/mocks/session';
import { useAppTheme } from '@/theme';

export default function Projects() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const { projects, createProject } = useDemoSession();
  const { colors } = useAppTheme();
  return <ScreenContainer title="Proyectos" tab action={<IconButton label="Crear proyecto" onPress={() => setOpen(true)}><Plus size={21} color={colors.text} strokeWidth={1.6} /></IconButton>}>
    <SculpturePanel title={'Tu biblioteca\ncreativa.'} caption={`${projects.length} proyectos · esta sesión`} />
    <SectionHeader title="Tus colecciones" />
    {projects.length ? projects.map(p => <ProjectCard key={p.id} project={p} />) : <EmptyState title="Tu primer proyecto" action="Crear proyecto" onPress={() => setOpen(true)} />}
    <ConfirmationModal visible={open} title="Nuevo proyecto" onClose={() => setOpen(false)}>
      <Field value={name} onChange={setName} placeholder="Nombre del proyecto" autoFocus />
      <Button label="Crear proyecto" icon={Plus} disabled={!name.trim()} onPress={() => { createProject(name.trim()); setName(''); setOpen(false); }} />
    </ConfirmationModal>
  </ScreenContainer>;
}
