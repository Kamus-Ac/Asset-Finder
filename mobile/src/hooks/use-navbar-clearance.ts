import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useNavbarClearance() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const barWidth = Math.max(0, Math.min(618, width - insets.left - insets.right));
  return insets.bottom + barWidth * 140 / 618 + 16;
}
