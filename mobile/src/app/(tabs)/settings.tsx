import { Pressable, View } from 'react-native';
import { Monitor, Moon, Sun, Check, WifiOff } from 'lucide-react-native';
import { Copy, Panel, ScreenContainer, SectionHeader } from '@/components/ui/kit';
import { useAppTheme, type Appearance } from '@/theme';
import app from '../../../app.json';
const appearances = [{ value: 'system', label: 'Sistema', icon: Monitor }, { value: 'light', label: 'Claro', icon: Sun }, { value: 'dark', label: 'Oscuro', icon: Moon }] as const;
export default function Settings() {
  const { appearance, setAppearance, colors } = useAppTheme();
  return <ScreenContainer title="Ajustes" tab>
    <SectionHeader title="Apariencia" />
    <Panel>{appearances.map(({ value, label, icon: Icon }) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: appearance === value }} onPress={() => setAppearance(value as Appearance)} className="min-h-14 flex-row items-center gap-4"><Icon size={21} color={colors.text} strokeWidth={1.7} /><View className="flex-1"><Copy>{label}</Copy></View>{appearance === value && <Check size={20} color={colors.accent} />}</Pressable>)}</Panel>
    <Panel><View className="flex-row items-center gap-3"><WifiOff size={20} color={colors.muted} /><Copy tone="muted">Backend sin conectar</Copy></View><Copy tone="muted" size={12}>Catálogo de ejemplo · proyectos temporales</Copy></Panel>
    <Copy tone="muted" size={12}>Assets finder · {app.expo.version}</Copy>
  </ScreenContainer>;
}
