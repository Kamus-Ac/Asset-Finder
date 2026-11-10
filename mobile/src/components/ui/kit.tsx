import type { ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { ArrowLeft, ArrowRight, Search, X, Inbox } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '@/components/app-background';
import { fontFamily } from '@/theme/fonts';
import { useAppTheme, tokens } from '@/theme';
import { artwork } from '@/mocks/catalog';
import type { AssetKind } from '@/types/domain';

export function Copy({ children, tone = 'text', size = 15, bold = false }: {
  children: ReactNode; tone?: 'text' | 'muted' | 'accent' | 'success' | 'danger'; size?: number; bold?: boolean;
}) {
  const { colors } = useAppTheme();
  return <Text style={{ fontFamily: bold ? fontFamily.semibold : fontFamily.regular, color: colors[tone], fontSize: size, lineHeight: size * 1.35 }}>{children}</Text>;
}
export function ScreenContainer({ children, title, tab = false, action }: {
  children: ReactNode; title: string; tab?: boolean; action?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return <AppBackground>
    <View className="flex-row items-center gap-3 px-6 pb-6" style={{ paddingTop: insets.top + 20 }}>
      {!tab && <IconButton label="Volver" onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><ArrowLeft size={22} color="#FFFFFF" /></IconButton>}
      <Text accessibilityRole="header" className="flex-1 font-sans-bold text-[28px] text-white">{title}</Text>
      {action}
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + (tab ? 124 : 28), gap: 20, width: '100%', maxWidth: 760, alignSelf: 'center' }}>{children}</ScrollView>
  </AppBackground>;
}
export function AppHeader({ title }: { eyebrow?: string; title: string; subtitle?: string }) { return <Copy size={24} bold>{title}</Copy>; }
export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useAppTheme();
  return <View className="gap-3 rounded-[20px] border p-5" style={[{ backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}
export function Button({ label, onPress, secondary = false, disabled = false, icon: Icon }: {
  label: string; onPress?: () => void; secondary?: boolean; disabled?: boolean; icon?: LucideIcon;
}) {
  const { colors } = useAppTheme();
  const color = secondary ? colors.text : '#FFFFFF';
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} className="min-h-14 flex-row items-center justify-center gap-3 rounded-[20px] px-5 py-4 active:opacity-70" style={{ backgroundColor: secondary ? colors.surface : '#A50DBD', opacity: disabled ? .4 : 1 }}>
    {Icon && <Icon color={color} size={21} strokeWidth={1.8} />}
    <Text className="font-sans-semibold text-base" style={{ color }}>{label}</Text>
  </Pressable>;
}
export const PrimaryButton = Button;
export function SecondaryButton(props: Omit<Parameters<typeof Button>[0], 'secondary'>) { return <Button {...props} secondary />; }
export function IconButton({ label, children, onPress }: { label: string; children: ReactNode; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} className="h-12 w-12 items-center justify-center rounded-[20px] bg-black/20 active:opacity-60">{children}</Pressable>;
}
export function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  const { colors } = useAppTheme();
  return <View className="flex-row items-center justify-between gap-3"><Copy size={20} bold>{title}</Copy>{action && <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onPress} className="min-h-12 flex-row items-center gap-2"><Copy tone="accent">{action}</Copy><ArrowRight size={18} color={colors.accent} /></Pressable>}</View>;
}
export function Row({ children }: { children: ReactNode }) { return <View className="flex-row flex-wrap items-center gap-3">{children}</View>; }
export function StatusBadge({ label }: { label: string }) {
  const { colors } = useAppTheme();
  return <View className="self-start rounded-full px-3 py-1.5" style={{ backgroundColor: colors.soft }}><Copy size={11} tone="accent" bold>{label}</Copy></View>;
}
export function DemoNotice({ text = 'Vista previa · datos de ejemplo' }: { text?: string }) { return <Copy size={12} tone="muted">{text}</Copy>; }
export function Art({ kind = 'chair', height = 220, variant = 'Principal' }: { kind?: AssetKind; height?: number; variant?: string }) {
  return <View className="w-full overflow-hidden rounded-[16px] bg-[#EEE8DF]" style={{ height }}>
    <Image accessibilityLabel={`Ilustración de ${kind}`} source={artwork[kind]} style={{ width: '100%', height: '100%', transform: [{ scale: variant === 'Detalle' ? 1.65 : variant === 'Escala' ? .72 : 1 }] }} contentFit="contain" />
  </View>;
}
export function Choices<T extends string>({ values, value, onChange }: { values: readonly T[]; value: T; onChange: (value: T) => void }) {
  const { colors } = useAppTheme();
  return <View className="flex-row flex-wrap gap-2">{values.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === value }} onPress={() => onChange(item)} className="min-h-12 justify-center rounded-[16px] px-4 py-3 active:opacity-70" style={{ backgroundColor: item === value ? '#320A3D' : colors.surface }}><Text className="font-sans-medium text-sm" style={{ color: item === value ? '#FFFFFF' : colors.muted }}>{item}</Text></Pressable>)}</View>;
}
export function Field({ value, onChange, placeholder = 'Nombre', autoFocus = false }: { value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  const { colors } = useAppTheme();
  return <TextInput accessibilityLabel={placeholder} placeholder={placeholder} placeholderTextColor={colors.muted} value={value} onChangeText={onChange} autoFocus={autoFocus} maxLength={60} className="min-h-14 rounded-[16px] border px-4 font-sans text-base" style={{ color: colors.text, backgroundColor: colors.background, borderColor: colors.border }} />;
}
export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { colors } = useAppTheme();
  return <View className="min-h-14 flex-row items-center gap-3 rounded-[20px] px-4" style={{ backgroundColor: colors.surface }}><Search size={20} color={colors.muted} /><TextInput accessibilityLabel="Buscar assets" placeholder="Buscar assets" placeholderTextColor={colors.muted} value={value} onChangeText={onChange} className="min-h-14 flex-1 font-sans text-base" style={{ color: colors.text }} />{value.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={() => onChange('')} className="h-12 w-10 items-center justify-center"><X size={18} color={colors.muted} /></Pressable>}</View>;
}
export function EmptyState({ title = 'Sin assets todavía', description, action, onPress }: { title?: string; description?: string; action?: string; onPress?: () => void }) {
  const { colors } = useAppTheme();
  return <Panel><View className="py-3"><Inbox size={30} strokeWidth={1.5} color={colors.muted} /></View><Copy size={20} bold>{title}</Copy>{description && <Copy tone="muted">{description}</Copy>}{action && <Button label={action} onPress={onPress} secondary />}</Panel>;
}
export function LoadingState() { const { colors } = useAppTheme(); return <Panel><ActivityIndicator color={colors.accent} /><Copy>Cargando…</Copy></Panel>; }
export function ErrorState({ onRetry }: { onRetry: () => void }) { return <EmptyState title="No se pudo cargar" action="Reintentar" onPress={onRetry} />; }
export function ConfirmationModal({ visible, title, children, onClose }: { visible: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const { colors } = useAppTheme();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center px-6" style={{ backgroundColor: colors.scrim }}>
      <View className="max-h-[85%] w-full max-w-[520px] self-center gap-5 rounded-[24px] p-6" style={{ backgroundColor: colors.surface }}>
        <View className="flex-row items-center gap-3"><View className="flex-1"><Copy size={23} bold>{title}</Copy></View><Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} className="h-12 w-12 items-center justify-center"><X color={colors.text} size={22} /></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 12 }}>{children}</ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
export function BackHome() { return <Button secondary label="Volver al inicio" onPress={() => router.replace('/')} />; }
export { tokens };
