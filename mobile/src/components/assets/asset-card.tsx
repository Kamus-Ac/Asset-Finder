import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowUpRight } from 'lucide-react-native';
import type { Asset } from '@/types/domain';
import { Art, Copy } from '@/components/ui/kit';
import { useAppTheme } from '@/theme';
export function AssetCard({ asset }: { asset: Asset }) {
  const { colors } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${asset.name}`} onPress={() => router.push({ pathname: '/asset/[id]', params: { id: asset.id } })} className="flex-1 gap-3 rounded-[20px] p-2.5 active:opacity-70" style={{ flexBasis: '44%', maxWidth: '49%', backgroundColor: colors.surface }}>
    <Art kind={asset.kind} height={145} />
    <View className="gap-1 px-1 pb-2"><Copy size={15} bold>{asset.name}</Copy><View className="flex-row items-center justify-between"><Copy size={11} tone="muted">{asset.available ? asset.format : 'Referencia'}</Copy><ArrowUpRight size={16} color={colors.muted} /></View></View>
  </Pressable>;
}
export function AssetGrid({ assets }: { assets: Asset[] }) { return <View className="flex-row flex-wrap gap-3">{assets.map(asset => <AssetCard key={asset.id} asset={asset} />)}</View>; }
