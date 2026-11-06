import { createContext, use, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
export const tokens = { space: { xs: 4, sm: 8, md: 12, lg: 20, xl: 28, xxl: 40 }, radius: { sm: 12, md: 20, lg: 28 }, type: { caption: 12, body: 15, heading: 22, display: 34 } };
const light = { background: '#F7F7FA', surface: '#FFFFFF', text: '#20202C', muted: '#727383', border: '#E4E4EC', accent: '#6950D7', soft: '#EDE9FC', success: '#267360', danger: '#B34152', onAccent: '#FFFFFF', stage: '#EEE8DF', scrim: '#00000088' };
const dark: typeof light = { background: '#14141C', surface: '#20202B', text: '#F4F2FA', muted: '#ACACBF', border: '#353544', accent: '#B09BFF', soft: '#302845', success: '#83CFB5', danger: '#F399A5', onAccent: '#201737', stage: '#EEE8DF', scrim: '#000000AA' };
export type Appearance = 'system' | 'light' | 'dark';
const Context = createContext({ colors: light, dark: false, appearance: 'system' as Appearance, setAppearance: (_value: Appearance) => { } });
export function AppTheme({ children }: {
  children: ReactNode;
}) {
  const [appearance, setAppearance] = useState<Appearance>('system');
  const system = useColorScheme();
  const isDark = (appearance === 'system' ? system : appearance) === 'dark';
  return <Context value={{ colors: isDark ? dark : light, dark: isDark, appearance, setAppearance }}>{children}</Context>;
}
export const useAppTheme = () => use(Context);
