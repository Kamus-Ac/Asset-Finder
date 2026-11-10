import AppBackground from '@/components/app-background';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EmptyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <AppBackground>
      <View className="px-7" style={{ paddingTop: insets.top + 24 }}>
        <Text accessibilityRole="header" className="font-sans-bold text-[30px] leading-9 tracking-tight text-white">
          Assets finder
        </Text>
      </View>
    </AppBackground>
  );
}
