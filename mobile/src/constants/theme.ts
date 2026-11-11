/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#251C32',
    background: '#F5F1F8',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E8DEF5',
    textSecondary: '#766A84',
  },
  dark: {
    text: '#F8F5FC',
    background: '#100E1B',
    backgroundElement: '#1C1725',
    backgroundSelected: '#251E30',
    textSecondary: '#B4AABC',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  sans: 'LINESeedJP_Regular',
  serif: 'LINESeedJP_Regular',
  rounded: 'LINESeedJP_Regular',
  mono: 'LINESeedJP_Regular',
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
