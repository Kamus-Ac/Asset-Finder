import { View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Art, Button, Copy, DemoNotice, Panel, Row, ScreenContainer, SectionHeader, StatusBadge } from '@/components/ui/kit';
import { ProjectCard } from '@/components/projects/project-card';
import { useDemoSession } from '@/mocks/session';
export default function Home() {
  const { projects } = useDemoSession();
  return <ScreenContainer title="Asset Finder" tab>
    <Row>
      <View style={{ flex: 1 }}>
        <Copy size={23} bold>◇ Asset Finder</Copy>
      </View>
      <StatusBadge label="VISTA PREVIA" />
    </Row>
    <AppHeader eyebrow="Bienvenido a tu próxima idea" title="Del mundo real.
A tu próxima escena." subtitle="Captura una referencia visual y encuentra assets similares para tus proyectos." />
    <Panel>
      <Art height={210} />
      <StatusBadge label="BÚSQUEDA VISUAL" />
      <Copy size={24} bold>Encuentra modelos 3D</Copy>
      <Copy tone="muted">Una fotografía es el punto de partida.</Copy>
      <Button label="Tomar fotografía" onPress={() => router.push('/capture')} />
      <Button secondary label="Seleccionar imagen" onPress={() => router.push('/reference')} />
    </Panel>
    <Row>
      <View style={{ flex: 1, minWidth: 130 }}>
        <Button secondary label="Buscar desde video" onPress={() => router.push({ pathname: '/capture', params: { mode: 'video' } })} />
      </View>
      <View style={{ flex: 1, minWidth: 130 }}>
        <Button secondary label="Explorar ejemplos" onPress={() => router.push('/results')} />
      </View>
    </Row>
    <SectionHeader title="De referencia a recurso" />
    <Panel>{[['01', 'Captura', 'Una imagen o un fotograma.'], ['02', 'Selecciona', 'Aísla el objeto que te inspira.'], ['03', 'Descubre', 'Compara y reúne tus assets.']].map(([n, title, text]) => <Row key={n}>
      <StatusBadge label={n} />
      <View style={{ flex: 1 }}>
        <Copy bold>{title}</Copy>
        <Copy size={13} tone="muted">{text}</Copy>
      </View>
    </Row>)}</Panel>
    <SectionHeader title="Proyectos recientes" action="Ver todos →" onPress={() => router.navigate('/(tabs)/projects')} />
    {projects.slice(0, 2).map(project => <ProjectCard key={project.id} project={project} />)}
    <Button secondary label="Explorar reconstrucción 3D" onPress={() => router.push('/reconstruction')} />
    <DemoNotice />
  </ScreenContainer>;
}
