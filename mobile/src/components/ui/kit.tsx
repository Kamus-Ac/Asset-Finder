import type { ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '@/components/app-background';
import Sculpture from '@/components/sculpture';
import { fontFamily } from '@/theme/fonts';
import { useAppTheme, tokens } from '@/theme';
import { useNavbarClearance } from '@/hooks/use-navbar-clearance';
import { artwork } from '@/mocks/catalog';
import type { AssetKind } from '@/types/domain';

export function Copy({ children, tone = 'text', size = 14, bold = false }: {
  children: ReactNode; tone?: 'text' | 'muted' | 'accent' | 'success' | 'danger'; size?: number; bold?: boolean;
}) {
  const { colors } = useAppTheme();
  return <Text style={{ fontFamily: bold ? fontFamily.semibold : fontFamily.regular, color: colors[tone], fontSize: size, lineHeight: size * 1.5, letterSpacing: size >= 22 ? -.7 : -.15 }}>{children}</Text>;
}

export function ScreenContainer({ children, title, tab = false, action }: {
  children: ReactNode; title: string; tab?: boolean; action?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const navbarClearance = useNavbarClearance();
  const { colors } = useAppTheme();
  return <AppBackground>
    <View className="w-full max-w-[760px] self-center px-6 pb-6" style={{ paddingTop: insets.top + 24 }}>
      <View className="flex-row items-center gap-3">
        {!tab && <IconButton label="Volver" onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><ArrowLeft size={20} color={colors.text} strokeWidth={1.6} /></IconButton>}
        <View className="flex-1 gap-1">
          <Text className="font-sans-bold text-[10px] tracking-wider" style={{ color: colors.accent }}>Assets Finder</Text>
          <Text accessibilityRole="header" className="font-sans text-[27px] leading-9 tracking-tight" style={{ color: colors.text }}>{title}</Text>
        </View>
        {action}
      </View>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: tab ? navbarClearance + 20 : insets.bottom + 32, gap: 18, width: '100%', maxWidth: 760, alignSelf: 'center' }}>{children}</ScrollView>
  </AppBackground>;
}

export function AppHeader({ title }: { eyebrow?: string; title: string; subtitle?: string }) { return <Copy size={24}>{title}</Copy>; }
export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useAppTheme();
  return <View className="gap-4 rounded-[28px] border p-5" style={[{ backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}

export function SculpturePanel({ title, caption, variant = 'orbit' }: { title: string; caption: string; variant?: 'orbit' | 'ribbon' }) {
  const { colors } = useAppTheme();
  return <View className="overflow-hidden rounded-[28px] border" style={{ minHeight: 190, backgroundColor: colors.surface, borderColor: colors.border }}>
    <View className="absolute" style={{ width: variant === 'orbit' ? 225 : 155, height: 215, right: variant === 'orbit' ? -100 : -10, bottom: -46, transform: [{ rotate: variant === 'orbit' ? '-12deg' : '12deg' }] }}><Sculpture variant={variant} /></View>
    <View className="justify-between gap-5 p-6" style={{ minHeight: 190, maxWidth: '75%' }}>
      <Copy size={25}>{title}</Copy>
      <Copy tone="muted" size={11}>{caption}</Copy>
    </View>
  </View>;
}

export function Button({ label, onPress, secondary = false, disabled = false, icon: Icon }: {
  label: string; onPress?: () => void; secondary?: boolean; disabled?: boolean; icon?: LucideIcon;
}) {
  const { colors } = useAppTheme();
  const color = secondary ? colors.text : colors.onAccent;
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} className="min-h-14 flex-row items-center justify-center gap-3 rounded-[18px] border px-5 py-4 active:opacity-70 web:focus-visible:opacity-70" style={{ backgroundColor: secondary ? colors.input : colors.action, borderColor: secondary ? colors.border : 'transparent', opacity: disabled ? .4 : 1 }}>
    {Icon && <Icon color={color} size={19} strokeWidth={1.6} />}
    <Text className="font-sans text-sm" style={{ color }}>{label}</Text>
  </Pressable>;
}
export const PrimaryButton = Button;
export function SecondaryButton(props: Omit<Parameters<typeof Button>[0], 'secondary'>) { return <Button {...props} secondary />; }
export function IconButton({ label, children, onPress }: { label: string; children: ReactNode; onPress: () => void }) {
  const { colors } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} className="h-11 w-11 items-center justify-center rounded-full border active:opacity-60 web:focus-visible:opacity-70" style={{ backgroundColor: colors.input, borderColor: colors.border }}>{children}</Pressable>;
}
export function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  const { colors } = useAppTheme();
  return <View className="flex-row items-center justify-between gap-3"><Copy size={18}>{title}</Copy>{action && <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onPress} className="min-h-11 flex-row items-center gap-2"><Copy tone="accent" size={12}>{action}</Copy><ArrowRight size={16} color={colors.accent} /></Pressable>}</View>;
}
export function Row({ children }: { children: ReactNode }) { return <View className="flex-row flex-wrap items-center gap-3">{children}</View>; }
export function StatusBadge({ label }: { label: string }) {
  const { colors } = useAppTheme();
  return <View className="self-start flex-row items-center gap-2 rounded-full border px-3 py-1.5" style={{ backgroundColor: colors.soft, borderColor: colors.border }}><View className="h-1 w-1 rounded-full" style={{ backgroundColor: colors.accent }} /><Copy size={10} tone="accent">{label}</Copy></View>;
}
export function DemoNotice({ text = 'Vista previa · datos de ejemplo' }: { text?: string }) { return <Copy size={12} tone="muted">{text}</Copy>; }
export function Art({ kind = 'chair', height = 220, variant = 'Principal' }: { kind?: AssetKind; height?: number; variant?: string }) {
  const { colors } = useAppTheme();
  return <View className="w-full overflow-hidden rounded-[18px]" style={{ height, backgroundColor: colors.stage }}>
    <Image accessibilityLabel={`Ilustración de ${kind}`} source={artwork[kind]} style={{ width: '100%', height: '100%', transform: [{ scale: variant === 'Detalle' ? 1.65 : variant === 'Escala' ? .72 : 1 }] }} contentFit="contain" />
  </View>;
}
export function Choices<T extends string>({ values, value, onChange }: { values: readonly T[]; value: T; onChange: (value: T) => void }) {
  const { colors } = useAppTheme();
  return <View className="flex-row flex-wrap gap-2">{values.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === value }} onPress={() => onChange(item)} className="min-h-11 justify-center rounded-full border px-4 py-2 active:opacity-70" style={{ backgroundColor: item === value ? colors.soft : colors.input, borderColor: item === value ? colors.accent : colors.border }}><Text className="font-sans text-xs" style={{ color: item === value ? colors.text : colors.muted }}>{item}</Text></Pressable>)}</View>;
}
export function Field({ value, onChange, placeholder = 'Nombre', autoFocus = false }: { value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  const { colors } = useAppTheme();
  return <TextInput accessibilityLabel={placeholder} placeholder={placeholder} placeholderTextColor={colors.muted} value={value} onChangeText={onChange} autoFocus={autoFocus} maxLength={60} className="min-h-14 rounded-[18px] border px-4 font-sans text-sm" style={{ color: colors.text, backgroundColor: colors.input, borderColor: colors.border }} />;
}
export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { colors } = useAppTheme();
  return <View className="min-h-14 flex-row items-center gap-3 rounded-full border px-4" style={{ backgroundColor: colors.input, borderColor: colors.border }}><Search size={19} color={colors.muted} strokeWidth={1.6} /><TextInput accessibilityLabel="Buscar assets" placeholder="¿Qué buscas?" placeholderTextColor={colors.muted} value={value} onChangeText={onChange} className="min-h-14 flex-1 font-sans text-sm" style={{ color: colors.text }} />{value.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={() => onChange('')} className="h-11 w-8 items-center justify-center"><X size={17} color={colors.muted} /></Pressable>}</View>;
}
export function EmptyState({ title = 'Sin assets todavía', description, action, onPress }: { title?: string; description?: string; action?: string; onPress?: () => void }) {
  return <Panel><View className="h-32 self-center" style={{ width: 180 }}><Sculpture /></View><Copy size={22}>{title}</Copy>{description && <Copy tone="muted">{description}</Copy>}{action && <Button label={action} onPress={onPress} secondary />}</Panel>;
}
export function LoadingState() { const { colors } = useAppTheme(); return <Panel><ActivityIndicator color={colors.accent} /><Copy>Cargando…</Copy></Panel>; }
export function ErrorState({ onRetry }: { onRetry: () => void }) { return <EmptyState title="No se pudo cargar" action="Reintentar" onPress={onRetry} />; }
export function ConfirmationModal({ visible, title, children, onClose }: { visible: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center px-6" style={{ backgroundColor: colors.scrim, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
      <View className="max-h-[85%] w-full max-w-[520px] self-center gap-5 rounded-[28px] border p-6" style={{ backgroundColor: colors.elevated, borderColor: colors.border }}>
        <View className="flex-row items-center gap-3"><View className="flex-1"><Copy size={22}>{title}</Copy></View><Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: colors.input }}><X color={colors.text} size={20} strokeWidth={1.5} /></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 14 }}>{children}</ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
export function BackHome() { return <Button secondary label="Volver al inicio" onPress={() => router.replace('/')} />; }
export { tokens };
