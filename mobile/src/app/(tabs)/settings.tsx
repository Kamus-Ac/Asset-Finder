import { Pressable, View } from 'react-native';
import { Monitor, Moon, Sun, Check, WifiOff } from 'lucide-react-native';
import { Copy, Panel, ScreenContainer, SectionHeader, StatusBadge } from '@/components/ui/kit';
import { useAppTheme } from '@/theme';
import app from '../../../app.json';

const appearances = [{ value: 'system', label: 'Sistema', icon: Monitor }, { value: 'light', label: 'Claro', icon: Sun }, { value: 'dark', label: 'Oscuro', icon: Moon }] as const;
export default function Settings() {
  const { appearance, setAppearance, colors } = useAppTheme();
  return <ScreenContainer title="Ajustes" tab>
    <SectionHeader title="Apariencia" />
    <Panel>{appearances.map(({ value, label, icon: Icon }, index) => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: appearance === value }} aria-checked={appearance === value} onPress={() => setAppearance(value)} className="min-h-16 flex-row items-center gap-4" style={{ borderBottomWidth: index < appearances.length - 1 ? 1 : 0, borderColor: colors.border }}>
      <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: appearance === value ? colors.soft : colors.input }}><Icon size={19} color={appearance === value ? colors.accent : colors.muted} strokeWidth={1.5} /></View>
      <View className="flex-1"><Copy>{label}</Copy></View>{appearance === value && <Check size={19} color={colors.accent} strokeWidth={1.6} />}
    </Pressable>)}</Panel>
    <SectionHeader title="Conexión" />
    <Panel><View className="flex-row items-center gap-3"><WifiOff size={19} color={colors.muted} strokeWidth={1.5} /><Copy>Modo local</Copy></View><Copy tone="muted" size={12}>Catálogo de ejemplo y proyectos de esta sesión.</Copy><StatusBadge label="Backend sin conectar" /></Panel>
    <View className="items-center gap-2 py-5"><Copy size={15} bold>Assets Finder</Copy><Copy tone="muted" size={11}>Versión {app.expo.version} · Powered by Sumalab</Copy></View>
  </ScreenContainer>;
}
