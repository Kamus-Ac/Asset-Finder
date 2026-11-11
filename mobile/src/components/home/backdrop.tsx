import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

export default function HomeBackdrop() {
  return <View pointerEvents="none" accessible={false} className="absolute inset-0">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id="home-violet" cx="146.25" cy="-200" r="900" gradientTransform="scale(1.333333 1)" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#A092E0" stopOpacity=".85" />
          <Stop offset=".22" stopColor="#7150E8" stopOpacity=".73" />
          <Stop offset=".33" stopColor="#6632EA" stopOpacity=".60" />
          <Stop offset=".44" stopColor="#5D23EB" stopOpacity=".40" />
          <Stop offset=".56" stopColor="#5415ED" stopOpacity=".16" />
          <Stop offset=".8" stopColor="#4A04EF" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="home-ember" cx="170" cy="780" r="330" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#E35024" stopOpacity=".10" />
          <Stop offset="1" stopColor="#E35024" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="390" height="844" fill="#100E1B" />
      <Rect width="390" height="844" fill="url(#home-violet)" />
      <Rect width="390" height="844" fill="url(#home-ember)" />
    </Svg>
  </View>;
}
