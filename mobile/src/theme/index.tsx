import { createContext, use, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export const tokens = {
  space: { xs: 4, sm: 8, md: 12, lg: 20, xl: 28, xxl: 40 },
  radius: { sm: 14, md: 20, lg: 28 },
  type: { caption: 12, body: 14, heading: 22, display: 30 },
};
const dark = {
  background: '#100E1B', surface: '#1C1725E8', elevated: '#251E30',
  text: '#F8F5FC', muted: '#B4AABC', border: '#FFFFFF1A',
  accent: '#C5B4ED', action: '#B34149', soft: '#A092E01A',
  input: '#100C18B3', success: '#9DCEBC', danger: '#F1A4A9',
  onAccent: '#FFFFFF', stage: '#17131E', scrim: '#08060DCC',
};
const light: typeof dark = {
  background: '#F5F1F8', surface: '#FFFFFFDE', elevated: '#FFFFFF',
  text: '#251C32', muted: '#766A84', border: '#3B22551A',
  accent: '#6E50AC', action: '#B34149', soft: '#A092E026',
  input: '#F1ECF6CC', success: '#356F5C', danger: '#A52F3A',
  onAccent: '#FFFFFF', stage: '#17131E', scrim: '#160F2877',
};
export type Appearance = 'system' | 'light' | 'dark';
const Context = createContext({ colors: dark, dark: true, appearance: 'dark' as Appearance, setAppearance: (_value: Appearance) => {} });

export function AppTheme({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>('dark');
  const system = useColorScheme();
  const isDark = (appearance === 'system' ? system : appearance) === 'dark';
  return <Context value={{ colors: isDark ? dark : light, dark: isDark, appearance, setAppearance }}>{children}</Context>;
}
export const useAppTheme = () => use(Context);
