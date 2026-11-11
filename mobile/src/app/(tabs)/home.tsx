import { useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Search, UserRound } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeBackdrop from '@/components/home/backdrop';
import HomeActionIcon from '@/components/home/action-icon';
import MediaFeedback from '@/components/media-feedback';
import { useMedia } from '@/media/context';
import { useNavbarClearance } from '@/hooks/use-navbar-clearance';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const { busy, choose } = useMedia();
  const navbarClearance = useNavbarClearance();
  // Preserve the reference composition on short screens without scrolling.
  const scale = Math.max(.1, Math.min((width - insets.left - insets.right) / 390, (height - insets.top - insets.bottom) / 844, (height - insets.top - navbarClearance) / 627, 1.4));

  function search() {
    Keyboard.dismiss();
    router.push({ pathname: '/results', params: { query: query.trim() } });
  }

  async function openFile() {
    if (await choose('library')) router.push('/reference');
  }

  return <View testID="home-screen" className="flex-1 overflow-hidden bg-[#100E14]">
    <HomeBackdrop />
    <View className="self-center" style={{ width: 390 * scale, height: 844 * scale, marginTop: insets.top }}>
      <View className="absolute flex-row items-start justify-between" style={{ top: 63 * scale, left: 24 * scale, right: 28 * scale }}>
        <View>
          <Text accessibilityRole="header" accessibilityLabel="Assets Finder" className="font-seed-extrabold text-white" style={{ fontSize: 19 * scale, lineHeight: 21 * scale, letterSpacing: -.9 * scale }}>{'Assets\nFinder'}</Text>
          <Text className="mt-1 font-seed text-[#A092E0]" style={{ fontSize: 6.5 * scale, opacity: .6 }}>Powered by Sumalab</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" onPress={() => router.navigate('/profile')} hitSlop={8} className="items-center justify-center rounded-full bg-[#140A2B] active:opacity-70" style={{ width: 44 * scale, height: 44 * scale, marginTop: 2 * scale }}>
          <UserRound color="#FFFFFF" size={22 * scale} strokeWidth={1.5} />
        </Pressable>
      </View>
      <Text accessibilityRole="header" className="absolute font-seed text-white" style={{ left: 38 * scale, top: 225 * scale, fontSize: 22.5 * scale, lineHeight: 24 * scale, letterSpacing: -1.25 * scale }}>{'¿Qué asset\nencontraremos hoy?'}</Text>
      <View className="absolute border border-white/10" style={{ top: 313 * scale, left: 40 * scale, width: 310 * scale, height: 200 * scale, borderRadius: 32 * scale, padding: 19 * scale, backgroundColor: '#FFFFFF0D' }}>
        <View className="flex-row items-center border border-white/15 bg-[#100D18]/60" style={{ height: 42 * scale, borderRadius: 24 * scale, paddingHorizontal: 13 * scale, gap: 11 * scale }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Buscar assets" hitSlop={10} onPress={search} className="active:opacity-60"><Search size={19 * scale} color="#97909F" strokeWidth={1.7} /></Pressable>
          <TextInput accessibilityLabel="¿Qué buscas?" placeholder="¿Qué buscas?" placeholderTextColor="#97909F" value={query} onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" maxLength={120} className="h-full flex-1 font-seed text-white" style={{ fontSize: 10 * scale, padding: 0 }} />
        </View>
        <View className="flex-1 flex-row" style={{ marginTop: 12 * scale, gap: 13 * scale }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Abrir archivo" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => { void openFile(); }} className="flex-1 items-center justify-center border border-white/15 bg-[#0D0B12]/80 active:bg-white/10" style={{ borderRadius: 16 * scale, gap: 2 * scale }}>
            {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : <HomeActionIcon name="folder" size={48 * scale} />}
            <Text className="font-seed text-white" style={{ fontSize: 9 * scale }}>Abrir archivo</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Escanear objeto" onPress={() => router.push('/capture')} className="flex-1 items-center justify-center border border-white/15 bg-[#0D0B12]/80 active:bg-white/10" style={{ borderRadius: 16 * scale, gap: 6 * scale }}>
            <HomeActionIcon name="scan" size={40 * scale} />
            <Text className="font-seed text-white" style={{ fontSize: 9 * scale }}>Escanear objeto</Text>
          </Pressable>
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Crear entorno" onPress={() => router.push('/environment')} className="absolute items-center justify-center border border-white/10 bg-[#0D090F]/80 active:bg-white/10" style={{ left: 40 * scale, top: 540 * scale, width: 314 * scale, height: 87 * scale, borderRadius: 16 * scale, gap: 2 * scale }}>
        <HomeActionIcon name="environment" size={39 * scale} />
        <Text className="font-seed text-white" style={{ fontSize: 9 * scale }}>Crear entorno</Text>
      </Pressable>
      <View pointerEvents="none" accessible={false} className="absolute" style={{ left: 0, top: 394 * scale, width: 402 * scale, height: 465 * scale }}>
        <Image source={require('@/assets/images/home-sculpture.png')} contentFit="contain" style={{ width: '100%', height: '100%' }} />
      </View>
    </View>
    <MediaFeedback />
  </View>;
}
