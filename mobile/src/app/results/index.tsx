import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { ArrowDownAZ, ArrowDownWideNarrow } from 'lucide-react-native';
import { AssetGrid } from '@/components/assets/asset-card';
import { Button, Choices, Copy, EmptyState, IconButton, LoadingState, Panel, ScreenContainer, SearchBar, StatusBadge } from '@/components/ui/kit';
import { useSession } from '@/session/context';
import { searchCatalog } from '@/services/catalog';
import { message } from '@/services/http';
import type { Asset } from '@/types/domain';
import { useAppTheme } from '@/theme';

export default function Results() {
  const { query: initialQuery, mode } = useLocalSearchParams<{ query?: string; mode?: string }>();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [filter, setFilter] = useState('Todos');
  const [alphabetic, setAlphabetic] = useState(false);
  const [items, setItems] = useState<Asset[]>([]);
  const [resolved, setResolved] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const { visual, registerAssets } = useSession();
  const { colors } = useAppTheme();
  const q = query.trim();
  const visualMode = mode === 'visual';
  useEffect(() => {
    if (visualMode || !q || q.length > 100) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setBusy(true); setError(null);
      searchCatalog(q, controller.signal).then(results => {
        if (!controller.signal.aborted) { setItems(results); registerAssets(results); setResolved(q); }
      }).catch(cause => { if (!controller.signal.aborted) { setError(message(cause)); setResolved(q); } }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q, retry, registerAssets, visualMode]);
  const source = visualMode ? visual?.assets ?? [] : resolved === q ? items : [];
  const filtered = source.filter(a => (filter === 'Todos' || (filter === 'Modelos 3D' ? a.available : !a.available)) && (!visualMode || a.name.toLocaleLowerCase().includes(q.toLocaleLowerCase()))).sort((a, b) => alphabetic ? a.name.localeCompare(b.name) : visualMode ? (b.score ?? -1) - (a.score ?? -1) : 0);
  const loading = !visualMode && !!q && q.length <= 100 && (busy || resolved !== q);
  const Icon = alphabetic ? ArrowDownAZ : ArrowDownWideNarrow;
  return <ScreenContainer title="Resultados" action={<IconButton label={alphabetic ? visualMode ? 'Ordenar por similitud' : 'Usar orden de la fuente' : 'Ordenar por nombre'} onPress={() => setAlphabetic(v => !v)}><Icon color={colors.text} size={20} strokeWidth={1.6} /></IconButton>}>
    <SearchBar value={query} onChange={setQuery} />
    <Choices values={['Todos', 'Modelos 3D', 'Referencias']} value={filter} onChange={setFilter} />
    <StatusBadge label={visualMode ? 'Comparación visual · muestra de modelos reales' : 'Búsqueda en Sketchfab'} />
    {visualMode && visual && <Panel>
      <Copy size={12} tone="muted">{visual.compared} de {visual.available} candidatos · {visual.seconds.toFixed(2)} s</Copy>
      <View className="flex-row gap-3">{[['Máscara del objeto', visual.mask], ['Recorte del objeto', visual.crop]].map(([label, uri]) => <View key={label} className="flex-1 gap-2"><Image source={{ uri }} accessibilityLabel={label} contentFit="contain" style={{ width: '100%', height: 120 }} /><Copy size={10} tone="muted">{label}</Copy></View>)}</View>
      {visual.warnings.map((warning, i) => <Copy key={i} size={11} tone="muted">{warning}</Copy>)}
    </Panel>}
    {!visualMode && !q ? <EmptyState title="Busca un modelo" description="Escribe el nombre del objeto para consultar el catálogo externo." /> : q.length > 100 ? <Panel><Copy tone="danger">Usa hasta 100 caracteres.</Copy></Panel> : visualMode && !visual ? <EmptyState title="No hay una comparación en esta sesión" /> : loading ? <LoadingState /> : !visualMode && error ? <Panel><Copy tone="danger">{error}</Copy><Button label="Reintentar búsqueda" onPress={() => setRetry(value => value + 1)} /></Panel> : <>
      <Copy tone="muted" size={12}>{filtered.length} {filtered.length === 1 ? 'modelo' : 'modelos'}{visualMode ? ' · puntuación de similitud, no porcentaje de acierto' : ' · orden de la fuente'}</Copy>
      {filtered.length ? <AssetGrid assets={filtered} /> : <EmptyState title="Sin coincidencias" action="Limpiar filtros" onPress={() => { setQuery(''); setFilter('Todos'); }} />}
    </>}
  </ScreenContainer>;
}
