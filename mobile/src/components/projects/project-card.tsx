import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { Project } from '@/types/domain';
import { assets } from '@/mocks/catalog';
import { Art, Copy } from '@/components/ui/kit';
import { useAppTheme } from '@/theme';
export function ProjectCard({ project }: {
  project: Project;
}) {
  const { colors } = useAppTheme();
  const asset = assets.find(item => item.id === project.assetIds[0]);
  return <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/projects/[id]', params: { id: project.id } })} style={({ pressed }) => ({ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', opacity: pressed ? .7 : 1 })}>{asset && <Art kind={asset.kind} height={135} />}<View style={{ padding: 18, gap: 5 }}>
    <Copy bold size={18}>{project.name}</Copy>
    <Copy tone="muted" size={13}>{project.description}</Copy>
    <Copy tone="accent" size={12}>{project.assetIds.length} assets · {project.updated}</Copy>
  </View>
  </Pressable>;
}
