import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Folder } from 'lucide-react-native';
import type { Project } from '@/types/domain';
import { Copy } from '@/components/ui/kit';
import { useAppTheme } from '@/theme';
export function ProjectCard({ project }: { project: Project }) {
  const { colors } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ${project.name}`} onPress={() => router.push({ pathname: '/projects/[id]', params: { id: project.id } })} className="min-h-24 flex-row items-center gap-4 rounded-[20px] p-5 active:opacity-70" style={{ backgroundColor: colors.surface }}>
    <View className="h-12 w-12 items-center justify-center rounded-[16px]" style={{ backgroundColor: colors.soft }}><Folder size={23} color={colors.accent} strokeWidth={1.6} /></View>
    <View className="flex-1 gap-1"><Copy bold size={17}>{project.name}</Copy><Copy tone="muted" size={13}>{project.assetIds.length} assets</Copy></View><ChevronRight size={20} color={colors.muted} />
  </Pressable>;
}
