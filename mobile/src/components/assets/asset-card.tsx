import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowUpRight } from 'lucide-react-native';
import type { Asset } from '@/types/domain';
import { Art, Copy } from '@/components/ui/kit';
import { useAppTheme } from '@/theme';

export function AssetCard({ asset }: { asset: Asset }) {
  const { colors } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${asset.name}`} onPress={() => router.push({ pathname: '/asset/[id]', params: { id: asset.id } })} className="flex-1 gap-3 rounded-[24px] border p-2 active:opacity-70" style={{ flexBasis: '44%', maxWidth: '49%', backgroundColor: colors.surface, borderColor: colors.border }}>
    <Art kind={asset.kind} height={145} />
    <View className="gap-2 px-2 pb-2"><Copy size={13}>{asset.name}</Copy><View className="flex-row items-center justify-between gap-1"><Copy size={10} tone="muted">{asset.available ? asset.format : 'Referencia'}</Copy><ArrowUpRight size={15} color={colors.accent} strokeWidth={1.5} /></View></View>
  </Pressable>;
}
export function AssetGrid({ assets }: { assets: Asset[] }) { return <View className="flex-row flex-wrap gap-3">{assets.map(asset => <AssetCard key={asset.id} asset={asset} />)}</View>; }
