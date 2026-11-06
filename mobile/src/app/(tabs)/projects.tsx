import { useState } from 'react';
import { TextInput } from 'react-native';
import { AppHeader, Button, Choices, ConfirmationModal, Copy, DemoNotice, EmptyState, ScreenContainer } from '@/components/ui/kit';
import { ProjectCard } from '@/components/projects/project-card';
import { useDemoSession } from '@/mocks/session';
import { useAppTheme } from '@/theme';
export default function Projects() {
  const [mode, setMode] = useState('Colecciones');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const { projects, createProject } = useDemoSession();
  const { colors } = useAppTheme();
  return <ScreenContainer title="Proyectos" tab>
    <AppHeader eyebrow="Tu biblioteca" title="Ideas, en un mismo lugar" subtitle="Colecciones pensadas para conectar tus referencias con la escena web." />
    <Button label="+ Crear proyecto de demostración" onPress={() => setOpen(true)} />
    <DemoNotice text="Proyectos de ejemplo. Sin cuenta, base de datos ni sincronización con la web." />
    <Choices values={['Colecciones', 'Vista vacía']} value={mode} onChange={setMode} />
    {mode === 'Colecciones' ? projects.map(p => <ProjectCard key={p.id} project={p} />) : <EmptyState title="Tu próxima escena empieza aquí" description="Agrupa modelos y referencias en un proyecto para dar forma a tus ideas." action="Crear un proyecto demo" onPress={() => setOpen(true)} />}
    <ConfirmationModal visible={open} title="Nuevo proyecto · demo" onClose={() => setOpen(false)}>
      <Copy tone="muted">Disponible en todos los recorridos durante esta sesión. No se sincroniza.</Copy>
      <TextInput autoFocus accessibilityLabel="Nombre del proyecto" placeholder="Nombre del proyecto" placeholderTextColor={colors.muted} value={name} onChangeText={setName} maxLength={60} style={{ color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, minHeight: 50 }} />
      <Button label="Crear proyecto demo" disabled={!name.trim()} onPress={() => { createProject(name.trim()); setName(''); setOpen(false); setMode('Colecciones'); }} />
    </ConfirmationModal>
  </ScreenContainer>;
}
