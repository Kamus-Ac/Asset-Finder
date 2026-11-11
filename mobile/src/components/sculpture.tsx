import { Image } from 'expo-image';
import { View } from 'react-native';

export default function Sculpture({ variant = 'orbit' }: { variant?: 'orbit' | 'ribbon' }) {
  return <View pointerEvents="none" accessible={false} className="h-full w-full">
    <Image source={variant === 'orbit' ? require('@/assets/images/orbit-sculpture.png') : require('@/assets/images/ribbon-sculpture.png')} contentFit="contain" style={{ width: '100%', height: '100%' }} />
  </View>;
}
