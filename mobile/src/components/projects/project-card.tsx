import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Folder } from 'lucide-react-native';
import type { Project } from '@/types/domain';
import { Copy } from '@/components/ui/kit';
import AssetPreview from '@/components/assets/asset-preview';
import { useSession } from '@/session/context';
import { useAppTheme } from '@/theme';

export function ProjectCard({ project }: { project: Project }) {
  const { colors } = useAppTheme();
  const { assets } = useSession();
  const preview = assets.find(asset => project.assetIds.includes(asset.id));
  return <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ${project.name}`} onPress={() => router.push({ pathname: '/projects/[id]', params: { id: project.id } })} className="min-h-24 flex-row items-center gap-4 rounded-[24px] border p-4 active:opacity-70" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
    <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-[16px] border" style={{ backgroundColor: colors.soft, borderColor: colors.border }}>{preview ? <AssetPreview asset={preview} height={56} /> : <Folder size={23} color={colors.accent} strokeWidth={1.4} />}</View>
    <View className="flex-1 gap-1"><Copy size={15}>{project.name}</Copy><Copy tone="muted" size={11}>{project.assetIds.length} assets</Copy></View><ChevronRight size={18} color={colors.muted} strokeWidth={1.5} />
  </Pressable>;
}
