import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { Asset } from '@/types/domain';
import { Art, Copy, StatusBadge } from '@/components/ui/kit';
import { useAppTheme } from '@/theme';
export function AssetCard({ asset }: {
  asset: Asset;
}) {
  const { colors } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${asset.name}`} onPress={() => router.push({ pathname: '/asset/[id]', params: { id: asset.id } })} style={({ pressed }) => ({ flexGrow: 1, flexBasis: '44%', maxWidth: '49%', backgroundColor: colors.surface, borderRadius: 20, padding: 10, gap: 8, borderWidth: 1, borderColor: colors.border, opacity: pressed ? .7 : 1 })}>
    <Art kind={asset.kind} height={150} />
    <Copy size={14} bold>{asset.name}</Copy>
    <Copy size={11} tone="muted">{asset.source}</Copy>
    <StatusBadge label={asset.available ? 'Archivo 3D · ejemplo' : 'Solo referencia'} />
    <View style={{ paddingVertical: 4 }}>
      <Copy size={11} tone="accent">Ranking {asset.score.toFixed(2)} · demo</Copy>
    </View>
  </Pressable>;
}
export function AssetGrid({ assets }: {
  assets: Asset[];
}) { return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{assets.map(asset => <AssetCard key={asset.id} asset={asset} />)}</View>; }
