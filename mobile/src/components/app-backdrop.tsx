import { View } from 'react-native';
import { Image } from 'expo-image';

// Rasterized from the adjacent SVG sources so Android and web share the same gradients.
export default function AppBackdrop({ dark = true }: { dark?: boolean }) {
  return <View pointerEvents="none" accessible={false} className="absolute inset-0">
    <Image source={dark ? require('@/assets/images/app-gradient-dark.png') : require('@/assets/images/app-gradient-light.png')} contentFit="fill" style={{ width: '100%', height: '100%' }} />
  </View>;
}
