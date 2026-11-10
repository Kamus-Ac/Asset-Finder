import { useCallback } from 'react';
import { View } from 'react-native';
import { useEvent } from 'expo';
import { useFocusEffect } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Copy } from '@/components/ui/kit';

export default function LocalVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  useFocusEffect(useCallback(() => () => { player.pause(); }, [player]));
  return <View className="gap-3 overflow-hidden rounded-[20px] bg-black">
    <VideoView player={player} nativeControls contentFit="contain" style={{ width: '100%', height: 300 }} />
    {status === 'error' && <View className="p-4"><Copy tone="danger">No se pudo reproducir este video.</Copy></View>}
  </View>;
}
