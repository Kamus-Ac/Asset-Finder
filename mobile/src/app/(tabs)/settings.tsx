import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Monitor, Moon, Sun, Check, Server } from 'lucide-react-native';
import { Button, Copy, Panel, ScreenContainer, SectionHeader, StatusBadge } from '@/components/ui/kit';
import { useAppTheme } from '@/theme';
import { checkHealth, visualCapacity } from '@/services/catalog';
import { message } from '@/services/http';
import app from '../../../app.json';

const appearances = [{ value: 'system', label: 'Sistema', icon: Monitor }, { value: 'light', label: 'Claro', icon: Sun }, { value: 'dark', label: 'Oscuro', icon: Moon }] as const;
export default function Settings() {
  const { appearance, setAppearance, colors } = useAppTheme();
  const [checking, setChecking] = useState(false);
  const [backend, setBackend] = useState('Sin comprobar');
  const [visual, setVisual] = useState('Sin comprobar');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function check() {
    if (checking) return;
    const request = new AbortController(); controller.current = request; setChecking(true);
    const [api, ai] = await Promise.allSettled([checkHealth(request.signal), visualCapacity(request.signal)]);
    if (!request.signal.aborted) {
      setBackend(api.status === 'fulfilled' ? 'Disponible' : message(api.reason));
      setVisual(ai.status === 'fulfilled' ? `Disponible · muestra de ${ai.value} modelos` : message(ai.reason));
      setChecking(false);
    }
  }
  return <ScreenContainer title="Ajustes" tab>
    <SectionHeader title="Apariencia" />
    <Panel>{appearances.map(({ value, label, icon: Icon }, index) => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: appearance === value }} aria-checked={appearance === value} onPress={() => setAppearance(value)} className="min-h-16 flex-row items-center gap-4" style={{ borderBottomWidth: index < appearances.length - 1 ? 1 : 0, borderColor: colors.border }}><View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: appearance === value ? colors.soft : colors.input }}><Icon size={19} color={appearance === value ? colors.accent : colors.muted} strokeWidth={1.5} /></View><View className="flex-1"><Copy>{label}</Copy></View>{appearance === value && <Check size={19} color={colors.accent} strokeWidth={1.6} />}</Pressable>)}</Panel>
    <SectionHeader title="Conexión" />
    <Panel>
      <View className="flex-row items-center gap-3"><Server size={19} color={colors.accent} strokeWidth={1.5} /><Copy>Servidor</Copy></View>
      <Copy size={12}>Backend: {backend}</Copy><Copy size={12} tone="muted">Comparación visual: {visual}</Copy>
      <Button secondary label={checking ? 'Comprobando…' : 'Comprobar conexión'} disabled={checking} onPress={() => { void check(); }} />
    </Panel>
    <Panel><StatusBadge label="Colecciones locales" /><Copy tone="muted" size={12}>Los proyectos se conservan durante esta sesión. El servidor todavía no ofrece guardado de proyectos ni reconstrucción 3D.</Copy></Panel>
    <View className="items-center gap-2 py-5"><Copy size={15} bold>Assets Finder</Copy><Copy tone="muted" size={11}>Versión {app.expo.version} · Powered by Sumalab</Copy></View>
  </ScreenContainer>;
}
