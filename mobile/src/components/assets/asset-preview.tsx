import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Image } from 'expo-image';
import { Box } from 'lucide-react-native';
import type { Asset } from '@/types/domain';
import { useAppTheme } from '@/theme';

export default function AssetPreview({ asset, height = 145, variant = 'Principal' }: { asset: Asset; height?: number; variant?: string }) {
  const { colors } = useAppTheme();
  const [failed, setFailed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  return <View className="w-full items-center justify-center overflow-hidden rounded-[18px]" style={{ height, backgroundColor: colors.stage }}>
    {asset.thumbnailUrl && failed !== asset.thumbnailUrl ? <Image source={{ uri: asset.thumbnailUrl }} accessibilityLabel={asset.name} contentFit="contain" onLoad={() => setLoaded(asset.thumbnailUrl!)} onError={() => setFailed(asset.thumbnailUrl!)} style={{ width: '100%', height: '100%', transform: [{ scale: variant === 'Detalle' ? 1.6 : variant === 'Escala' ? .75 : 1 }] }} /> : <Box accessibilityLabel="Miniatura no disponible" size={30} color={colors.muted} strokeWidth={1.3} />}
    {asset.thumbnailUrl && failed !== asset.thumbnailUrl && loaded !== asset.thumbnailUrl && <View pointerEvents="none" className="absolute inset-0 items-center justify-center"><ActivityIndicator color={colors.muted} size="small" /></View>}
  </View>;
}
