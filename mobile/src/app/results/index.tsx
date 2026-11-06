import { useState } from 'react';
import { View } from 'react-native';
import { AppHeader, Art, Button, Choices, Copy, DemoNotice, EmptyState, ErrorState, LoadingState, Panel, Row, ScreenContainer, SearchBar } from '@/components/ui/kit';
import { AssetGrid } from '@/components/assets/asset-card';
import { assets } from '@/mocks/catalog';
export default function Results() {
  const [state, setState] = useState('Resultados');
  const [filter, setFilter] = useState('Todos');
  const [order, setOrder] = useState('Ranking');
  const [query, setQuery] = useState('');
  const filtered = assets.filter(a => (filter === 'Todos' || a.available) && a.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a, b) => order === 'Nombre' ? a.name.localeCompare(b.name) : b.score - a.score);
  return <ScreenContainer title="Modelos similares">
    <AppHeader eyebrow="03 / Descubre" title="Ideas que encajan" subtitle="Explora formas, materiales y nuevas posibilidades." />
    <Panel>
      <Row>
        <View style={{ width: 82 }}>
          <Art height={82} />
        </View>
        <View style={{ flex: 1 }}>
          <Copy bold>Tu objeto de referencia</Copy>
          <Copy size={12} tone="muted">Silla · selección ilustrativa</Copy>
        </View>
      </Row>
    </Panel>
    <DemoNotice text="Catálogo y ranking ficticios. La similitud es una puntuación de orden, no un porcentaje de acierto. No se ha ejecutado IA." />
    <SearchBar value={query} onChange={setQuery} />
    <Choices values={['Todos', 'Con archivo 3D']} value={filter} onChange={setFilter} />
    <Choices values={['Ranking', 'Nombre']} value={order} onChange={setOrder} />
    <Copy bold size={18}>{filtered.length} ejemplos de catálogo</Copy>
    {state === 'Resultados' && (filtered.length ? <AssetGrid assets={filtered} /> : <EmptyState title="Sin coincidencias en los ejemplos" description="Prueba otro nombre o cambia los filtros." action="Limpiar filtros" onPress={() => { setQuery(''); setFilter('Todos'); }} />)}
    {state === 'Cargando' && <LoadingState />}{state === 'Vacío' && <EmptyState title="No hay resultados · demo" description="Aquí podrás cambiar la referencia o ampliar los filtros." action="Ver ejemplos" onPress={() => setState('Resultados')} />}{state === 'Error' && <ErrorState onRetry={() => setState('Resultados')} />}
    <Panel>
      <Copy size={12} tone="muted">REVISAR ESTADOS DE INTERFAZ · DEMO</Copy>
      <Choices values={['Resultados', 'Cargando', 'Vacío', 'Error']} value={state} onChange={setState} />
      <Button secondary label="Restablecer vista" onPress={() => { setState('Resultados'); setQuery(''); setFilter('Todos'); setOrder('Ranking'); }} />
    </Panel>
  </ScreenContainer>;
}
