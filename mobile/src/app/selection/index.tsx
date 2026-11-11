import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { RotateCcw, Search } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useMedia } from '@/media/context';
import { containedImage, pointInImage, selectionBox } from '@/media/geometry';
import { useAppTheme } from '@/theme';
import { useSession } from '@/session/context';
import { compareVisual, visualCapacity } from '@/services/catalog';
import { message } from '@/services/http';
import { Button, Choices, Copy, EmptyState, IconButton, Panel, ScreenContainer, StatusBadge } from '@/components/ui/kit';

export default function Selection() {
  const { reference } = useMedia();
  const { colors } = useAppTheme();
  const { setVisual } = useSession();
  const [tool, setTool] = useState('Rectángulo');
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [center, setCenter] = useState({ x: .5, y: .5 });
  const [viewWidth, setViewWidth] = useState(1);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [candidateCount, setCandidateCount] = useState('10');
  const [resultCount, setResultCount] = useState('5');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const touchSurface = useRef<ComponentRef<typeof View>>(null);
  const reset = () => { setPoints([]); setCenter({ x: .5, y: .5 }); setError(null); };
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    const request = new AbortController();
    visualCapacity(request.signal).then(count => {
      if (!request.signal.aborted) { setCapacity(count); setCapacityError(null); setCandidateCount(String(Math.min(10, count))); setResultCount(String(Math.min(5, count))); }
    }).catch(cause => { if (!request.signal.aborted) setCapacityError(message(cause)); });
    return () => request.abort();
  }, [retry]);
  if (!reference) return <ScreenContainer title="Seleccionar"><EmptyState title="Envía una imagen primero" action="Elegir referencia" onPress={() => router.replace('/reference')} /></ScreenContainer>;
  const frame = containedImage(viewWidth, 320, reference.width, reference.height);
  const box = selectionBox(center, reference.width, reference.height);
  const n = Number(candidateCount), k = Number(resultCount);
  const validCounts = /^\d+$/.test(candidateCount) && /^\d+$/.test(resultCount) && Number.isSafeInteger(n) && Number.isSafeInteger(k) && n > 0 && k > 0 && k <= n && !!capacity && n <= capacity;
  function cancel() { controller.current?.abort(); controller.current = null; setBusy(false); }
  async function compare() {
    if (!reference || !validCounts || busy) return;
    const request = new AbortController(); controller.current = request; setBusy(true); setError(null);
    try {
      const result = await compareVisual({ media_id: reference.id, candidate_limit: n, k, ...(tool === 'Puntos' ? { points: points.map(point => ({ x: Math.min(reference.width - 1, Math.round(point.x * reference.width)), y: Math.min(reference.height - 1, Math.round(point.y * reference.height)), label: 1 as const })) } : { box }) }, request.signal);
      if (!request.signal.aborted) { setVisual(result); router.push({ pathname: '/results', params: { mode: 'visual' } }); }
    } catch (cause) { if (!request.signal.aborted) setError(message(cause)); }
    finally { if (controller.current === request) { controller.current = null; setBusy(false); } }
  }
  return <ScreenContainer title="Seleccionar" action={<IconButton label="Reiniciar selección" onPress={reset}><RotateCcw size={21} color={colors.text} /></IconButton>}>
    <StatusBadge label="Búsqueda visual" />
    <View onLayout={event => setViewWidth(Math.max(1, event.nativeEvent.layout.width - 2))} className="overflow-hidden rounded-[28px] border" style={{ borderColor: colors.border, backgroundColor: colors.input }}>
      <View pointerEvents="none"><Image source={{ uri: reference.fileUrl }} accessibilityLabel="Imagen normalizada en el servidor" style={{ width: '100%', height: 320 }} contentFit="contain" /></View>
      <View pointerEvents="none" className="absolute" style={{ left: frame.x + 1, top: frame.y + 1, width: frame.width, height: frame.height }}>
        {tool === 'Rectángulo' && <View className="absolute rounded-[12px] border-2" style={{ left: `${center.x * 100 - 25}%`, top: `${center.y * 100 - 30}%`, width: '50%', height: '60%', borderColor: colors.accent }} />}
        {tool === 'Puntos' && points.map((point, i) => <View key={i} className="absolute h-4 w-4 rounded-full border-2 border-white" style={{ backgroundColor: colors.action, left: `${point.x * 100}%`, top: `${point.y * 100}%`, transform: [{ translateX: -8 }, { translateY: -8 }] }} />)}
      </View>
      <Pressable ref={touchSurface} accessibilityRole="button" accessibilityLabel="Toca para ubicar la selección o añadir puntos" disabled={busy} className="absolute" style={{ left: 1, top: 1, right: 1, bottom: 1 }} onPress={event => {
        const { locationX, locationY, pageX, pageY } = event.nativeEvent;
        const locate = (x: number, y: number) => {
          const point = pointInImage(x, y, frame);
          if (!point) return;
          if (tool === 'Puntos') setPoints(current => current.length < 100 ? [...current, point] : current);
          else setCenter({ x: Math.max(.25, Math.min(.75, point.x)), y: Math.max(.3, Math.min(.7, point.y)) });
        };
        if (Number.isFinite(locationX) && Number.isFinite(locationY)) locate(locationX, locationY);
        else touchSurface.current?.measure((_x, _y, _width, _height, left, top) => locate(pageX - left, pageY - top));
      }} />
    </View>
    {!busy && <Choices values={['Rectángulo', 'Puntos']} value={tool} onChange={setTool} />}
    <Copy tone="muted" size={12}>{tool === 'Puntos' ? `${points.length} puntos · toca el objeto para añadir` : 'Toca para mover el área sobre el objeto.'}</Copy>
    {capacityError ? <Panel><Copy tone="danger">{capacityError}</Copy><Button secondary label="Revisar servicio visual" onPress={() => setRetry(value => value + 1)} /><Button secondary label="Buscar por nombre" onPress={() => router.push('/results')} /></Panel> : capacity === null ? <Panel><ActivityIndicator color={colors.accent} /><Copy tone="muted" size={12}>Comprobando comparación visual…</Copy></Panel> : <Panel>
      <Copy tone="muted" size={12}>Muestra de {capacity} modelos reales</Copy>
      <View className="flex-row gap-3">{[['Candidatos', candidateCount, setCandidateCount], ['Resultados', resultCount, setResultCount]].map(([label, value, change]) => <View key={label as string} className="flex-1 gap-2"><Copy size={12}>{label as string}</Copy><TextInput accessibilityLabel={label as string} value={value as string} onChangeText={change as (text: string) => void} editable={!busy} keyboardType="number-pad" maxLength={4} className="min-h-12 rounded-[16px] border px-3 font-sans text-sm" style={{ color: colors.text, backgroundColor: colors.input, borderColor: colors.border }} /></View>)}</View>
      {!validCounts && <Copy size={11} tone="danger">Elige de 1 a {capacity} candidatos y hasta esa cantidad de resultados.</Copy>}
    </Panel>}
    {error && <Panel><Copy tone="danger">{error}</Copy></Panel>}
    <Button label={busy ? 'Comparando objeto…' : 'Buscar similares'} icon={Search} disabled={busy || !validCounts || (tool === 'Puntos' && !points.length)} onPress={() => { void compare(); }} />
    {busy && <><Copy tone="muted" size={11}>La primera comparación puede tardar mientras se cargan los modelos.</Copy><Button secondary label="Cancelar espera" onPress={cancel} /></>}
  </ScreenContainer>;
}
