import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/theme';

export function useTheme() {
  const { dark } = useAppTheme();
  return Colors[dark ? 'dark' : 'light'];
}
