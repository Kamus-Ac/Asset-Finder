import type { ReactNode } from 'react';
import { View } from 'react-native';
import AppBackdrop from '@/components/app-backdrop';
import { useAppTheme } from '@/theme';

export default function AppBackground({ children }: { children?: ReactNode }) {
  const { colors, dark } = useAppTheme();
  return <View className="flex-1" style={{ backgroundColor: colors.background }}>
    <AppBackdrop dark={dark} />
    {children}
  </View>;
}
