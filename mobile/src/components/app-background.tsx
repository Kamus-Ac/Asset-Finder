import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useAppTheme } from '@/theme';

export default function AppBackground({ children }: { children?: ReactNode }) {
  const { colors } = useAppTheme();

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: colors.background,
        backgroundImage: `linear-gradient(to bottom, #CD0EEA 0%, #CD0EEA40 24%, ${colors.background} 60%)`,
      }}>
      {children}
    </View>
  );
}
