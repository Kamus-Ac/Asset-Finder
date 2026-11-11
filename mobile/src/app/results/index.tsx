import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ArrowDownAZ, ArrowDownWideNarrow } from 'lucide-react-native';
import { AssetGrid } from '@/components/assets/asset-card';
import { Choices, EmptyState, IconButton, ScreenContainer, SearchBar, StatusBadge } from '@/components/ui/kit';
import { assets } from '@/mocks/catalog';
export default function Results() {
  const { query: initialQuery } = useLocalSearchParams<{ query?: string }>();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [filter, setFilter] = useState('Todos');
  const [alphabetic, setAlphabetic] = useState(false);
  const Icon = alphabetic ? ArrowDownAZ : ArrowDownWideNarrow;
  const filtered = assets.filter(a => (filter === 'Todos' || (filter === 'Modelos 3D' ? a.available : !a.available)) && a.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a, b) => alphabetic ? a.name.localeCompare(b.name) : b.score - a.score);
  return <ScreenContainer title="Resultados" action={<IconButton label={alphabetic ? 'Ordenar por relevancia' : 'Ordenar por nombre'} onPress={() => setAlphabetic(v => !v)}><Icon color="#FFFFFF" size={22} /></IconButton>}>
    <SearchBar value={query} onChange={setQuery} />
    <Choices values={['Todos', 'Modelos 3D', 'Referencias']} value={filter} onChange={setFilter} />
    <StatusBadge label="Catálogo de ejemplo" />
    {filtered.length ? <AssetGrid assets={filtered} /> : <EmptyState title="Sin coincidencias" action="Limpiar filtros" onPress={() => { setQuery(''); setFilter('Todos'); }} />}
  </ScreenContainer>;
}
