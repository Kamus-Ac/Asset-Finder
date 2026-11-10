import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Camera, ImagePlus, Video, ArrowUpRight, Boxes, Box, ChevronRight } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '@/components/app-background';
import MediaFeedback from '@/components/media-feedback';
import { useMedia } from '@/media/context';
import type { MediaAction } from '@/media/picker';
import { useAppTheme } from '@/theme';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const { colors, dark } = useAppTheme();
  const { media, busy, choose } = useMedia();
  const surface = dark ? '#24182F' : '#F3EAF7';
  const border = dark ? '#614169' : '#D3B3DE';
  async function open(action: MediaAction) {
    if (await choose(action)) router.push('/reference');
  }
  return <AppBackground>
    <View className="flex-1 px-6" style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 112 }}>
      <View className="flex-row items-center gap-3">
        <Text accessibilityRole="header" className="flex-1 font-sans-bold text-[30px] leading-9 tracking-tight text-white">Assets finder</Text>
        {media && compact && <Pressable accessibilityRole="button" accessibilityLabel="Abrir última referencia" onPress={() => router.push('/reference')} className="h-10 w-10 items-center justify-center rounded-[14px] bg-white/15"><ImagePlus size={21} color="#FFFFFF" /></Pressable>}
      </View>
      <View className="mt-5 flex-1 gap-3" style={{ maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        {!compact && <Text className="mb-1 font-sans-semibold text-xl text-white">Nueva búsqueda</Text>}
        <MediaFeedback />
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => { void open('photo'); }} className="flex-1 justify-between rounded-[24px] border border-[#E67AF6] bg-[#68167C] p-5 active:opacity-80" style={{ minHeight: compact ? 128 : 150 }}>
          <View className="flex-row items-start justify-between">
            <View className="h-12 w-12 items-center justify-center rounded-[16px] bg-white/15">{busy ? <ActivityIndicator color="#FFFFFF" /> : <Camera size={26} color="#FFFFFF" strokeWidth={1.6} />}</View>
            <ArrowUpRight size={24} color="#FFFFFF" strokeWidth={1.5} />
          </View>
          <Text className="mt-2 font-sans-semibold text-[26px] leading-8 text-white">Tomar foto</Text>
        </Pressable>
        <View className="flex-1 flex-row gap-3" style={{ minHeight: compact ? 96 : 112, maxHeight: compact ? 112 : 176 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Seleccionar imagen" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => { void open('library'); }} className="flex-1 justify-between gap-3 rounded-[20px] border p-4 active:opacity-70" style={{ minHeight: compact ? 84 : 112, backgroundColor: surface, borderColor: border }}>
            <ImagePlus size={25} color={colors.text} strokeWidth={1.6} /><Text className="font-sans-semibold text-base" style={{ color: colors.text }}>Seleccionar foto</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Grabar video" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => { void open('video'); }} className="flex-1 justify-between gap-3 rounded-[20px] border p-4 active:opacity-70" style={{ minHeight: compact ? 84 : 112, backgroundColor: surface, borderColor: border }}>
            <Video size={25} color={colors.text} strokeWidth={1.6} /><Text className="font-sans-semibold text-base" style={{ color: colors.text }}>Grabar video</Text>
          </Pressable>
        </View>
        {media && !compact && <Pressable accessibilityRole="button" accessibilityLabel="Abrir última referencia" onPress={() => router.push('/reference')} className="min-h-16 flex-row items-center gap-3 rounded-[20px] border px-3 py-2" style={{ backgroundColor: surface, borderColor: border }}>
          {media.type === 'image' ? <Image source={{ uri: media.uri }} style={{ width: 44, height: 44, borderRadius: 12 }} contentFit="cover" /> : <Video size={24} color={colors.text} />}
          <View className="flex-1"><Text numberOfLines={1} className="font-sans-medium text-sm" style={{ color: colors.text }}>Última referencia</Text></View><ChevronRight size={18} color={colors.text} />
        </Pressable>}
        <View className="flex-row gap-3">
          <Pressable accessibilityRole="button" onPress={() => router.push('/results')} className="min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-[20px] border px-2 active:opacity-70" style={{ backgroundColor: surface, borderColor: border }}><Boxes size={18} color={colors.text} /><Text className="font-sans-medium text-sm" style={{ color: colors.text }}>Catálogo</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/reconstruction')} className="min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-[20px] border px-2 active:opacity-70" style={{ backgroundColor: surface, borderColor: border }}><Box size={18} color={colors.text} /><Text className="font-sans-medium text-sm" style={{ color: colors.text }}>Reconstruir</Text></Pressable>
        </View>
      </View>
    </View>
  </AppBackground>;
}
