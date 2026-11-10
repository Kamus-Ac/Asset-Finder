import { useState } from 'react';
import { Plus } from 'lucide-react-native';
import { Button, ConfirmationModal, Copy, EmptyState, Field, IconButton, ScreenContainer } from '@/components/ui/kit';
import { ProjectCard } from '@/components/projects/project-card';
import { useDemoSession } from '@/mocks/session';
export default function Projects() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const { projects, createProject } = useDemoSession();
  return <ScreenContainer title="Proyectos" tab action={<IconButton label="Crear proyecto" onPress={() => setOpen(true)}><Plus size={22} color="#FFFFFF" /></IconButton>}>
    <Copy tone="muted" size={12}>Colecciones locales · esta sesión</Copy>
    {projects.length ? projects.map(p => <ProjectCard key={p.id} project={p} />) : <EmptyState title="Tu primer proyecto" action="Crear proyecto" onPress={() => setOpen(true)} />}
    <ConfirmationModal visible={open} title="Nuevo proyecto" onClose={() => setOpen(false)}>
      <Field value={name} onChange={setName} placeholder="Nombre del proyecto" autoFocus />
      <Button label="Crear proyecto" icon={Plus} disabled={!name.trim()} onPress={() => { createProject(name.trim()); setName(''); setOpen(false); }} />
    </ConfirmationModal>
  </ScreenContainer>;
}
