import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { ArrowDownAZ, ArrowDownWideNarrow } from 'lucide-react-native';
import { AssetGrid } from '@/components/assets/asset-card';
import { Choices, Copy, EmptyState, IconButton, ScreenContainer, SearchBar, StatusBadge } from '@/components/ui/kit';
import { assets } from '@/mocks/catalog';
import { useAppTheme } from '@/theme';

export default function Results() {
  const { query: initialQuery } = useLocalSearchParams<{ query?: string }>();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [filter, setFilter] = useState('Todos');
  const [alphabetic, setAlphabetic] = useState(false);
  const { colors } = useAppTheme();
  const Icon = alphabetic ? ArrowDownAZ : ArrowDownWideNarrow;
  const filtered = assets.filter(a => (filter === 'Todos' || (filter === 'Modelos 3D' ? a.available : !a.available)) && a.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a, b) => alphabetic ? a.name.localeCompare(b.name) : b.score - a.score);
  return <ScreenContainer title="Resultados" action={<IconButton label={alphabetic ? 'Ordenar por relevancia' : 'Ordenar por nombre'} onPress={() => setAlphabetic(v => !v)}><Icon color={colors.text} size={20} strokeWidth={1.6} /></IconButton>}>
    <SearchBar value={query} onChange={setQuery} />
    <Choices values={['Todos', 'Modelos 3D', 'Referencias']} value={filter} onChange={setFilter} />
    <View className="flex-row flex-wrap items-center justify-between gap-2"><Copy tone="muted" size={12}>{filtered.length} {filtered.length === 1 ? 'asset' : 'assets'}</Copy><StatusBadge label="Catálogo de ejemplo" /></View>
    {filtered.length ? <AssetGrid assets={filtered} /> : <EmptyState title="Sin coincidencias" action="Limpiar filtros" onPress={() => { setQuery(''); setFilter('Todos'); }} />}
  </ScreenContainer>;
}
