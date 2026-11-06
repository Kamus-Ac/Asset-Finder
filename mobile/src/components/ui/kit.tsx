import type { ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, tokens } from '@/theme';
import { artwork } from '@/mocks/catalog';
import type { AssetKind } from '@/types/domain';
export function Copy({ children, tone = 'text', size = tokens.type.body, bold = false }: {
  children: ReactNode;
  tone?: 'text' | 'muted' | 'accent' | 'success' | 'danger';
  size?: number;
  bold?: boolean;
}) {
  const { colors } = useAppTheme();
  return <Text selectable style={{ color: colors[tone], fontSize: size, lineHeight: size * 1.4, fontWeight: bold ? '700' : '400' }}>{children}</Text>;
}
export function ScreenContainer({ children, title, tab = false }: {
  children: ReactNode;
  title: string;
  tab?: boolean;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return <>
    {!tab && <Stack.Screen options={{ title }} />}
    <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: tokens.space.lg, paddingTop: tab ? insets.top + 16 : 20, paddingBottom: insets.bottom + 32, gap: 22, width: '100%', maxWidth: 760, alignSelf: 'center' }}>{children}</ScrollView>
  </>;
}
export function AppHeader({ eyebrow, title, subtitle }: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return <View style={{ gap: 7 }}>{eyebrow && <Copy tone="accent" size={12} bold>{eyebrow.toUpperCase()}</Copy>}<Copy size={tokens.type.display} bold>{title}</Copy>{subtitle && <Copy tone="muted">{subtitle}</Copy>}</View>;
}
export function Panel({ children, style }: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  return <View style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: tokens.radius.md, padding: 18, gap: 12 }, style]}>{children}</View>;
}
export function Button({ label, onPress, secondary = false, disabled = false }: {
  label: string;
  onPress?: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => ({ minHeight: 50, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 15, backgroundColor: secondary ? colors.soft : colors.accent, alignItems: 'center', justifyContent: 'center', opacity: disabled ? .4 : pressed ? .7 : 1 })}>
    <Text style={{ color: secondary ? colors.accent : colors.onAccent, fontWeight: '700', fontSize: tokens.type.body, textAlign: 'center' }}>{label}</Text>
  </Pressable>;
}
export const PrimaryButton = Button;
export function SecondaryButton(props: Omit<Parameters<typeof Button>[0], 'secondary'>) { return <Button {...props} secondary />; }
export function IconButton({ label, children, onPress }: {
  label: string;
  children: ReactNode;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ minWidth: 48, minHeight: 48, borderRadius: 16, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center', opacity: pressed ? .6 : 1 })}>{children}</Pressable>;
}
export function SectionHeader({ title, action, onPress }: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return <Row>
    <View style={{ flex: 1 }}>
      <Copy size={20} bold>{title}</Copy>
    </View>{action && <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 48, justifyContent: 'center' }}>
      <Copy tone="accent" size={13} bold>{action}</Copy>
    </Pressable>}</Row>;
}
export function Row({ children }: {
  children: ReactNode;
}) { return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>{children}</View>; }
export function StatusBadge({ label }: {
  label: string;
}) {
  const { colors } = useAppTheme();
  return <View style={{ alignSelf: 'flex-start', backgroundColor: colors.soft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 }}>
    <Copy size={11} tone="accent" bold>{label}</Copy>
  </View>;
}
export function DemoNotice({ text = 'Recorrido de demostración · datos locales, sin conexión a IA.' }: {
  text?: string;
}) { return <Copy size={12} tone="muted">{text}</Copy>; }
export function Art({ kind = 'chair', height = 220, variant = 'Principal' }: {
  kind?: AssetKind;
  height?: number;
  variant?: string;
}) {
  const { colors } = useAppTheme();
  return <View style={{ width: '100%', height, borderRadius: tokens.radius.sm, overflow: 'hidden', backgroundColor: colors.stage }}>
    <Image accessibilityLabel={`Ilustración local de ${kind}, ${variant}`} source={artwork[kind]} style={{ width: '100%', height: '100%', transform: [{ scale: variant === 'Detalle' ? 1.65 : variant === 'Escala' ? .72 : 1 }] }} contentFit="contain" />
  </View>;
}
export function Choices<T extends string>({ values, value, onChange }: {
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useAppTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{values.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === value }} onPress={() => onChange(item)} style={({ pressed }) => ({ paddingHorizontal: 13, minHeight: 46, justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: item === value ? colors.accent : colors.border, backgroundColor: item === value ? colors.soft : colors.surface, opacity: pressed ? .6 : 1 })}>
    <Copy size={13} tone={item === value ? 'accent' : 'muted'} bold={item === value}>{item}</Copy>
  </Pressable>)}</View>;
}
export function SearchBar({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) { const { colors } = useAppTheme(); return <TextInput accessibilityLabel="Filtrar ejemplos por nombre" placeholder="Buscar en los ejemplos…" placeholderTextColor={colors.muted} value={value} onChangeText={onChange} style={{ minHeight: 52, padding: 15, color: colors.text, backgroundColor: colors.surface, borderRadius: 15, borderWidth: 1, borderColor: colors.border }} />; }
export function EmptyState({ title = 'Un espacio para tus ideas', description = 'Aún no hay assets en esta colección de demostración.', action, onPress }: {
  title?: string;
  description?: string;
  action?: string;
  onPress?: () => void;
}) {
  return <Panel>
    <Copy tone="accent" size={32}>◇</Copy>
    <Copy size={21} bold>{title}</Copy>
    <Copy tone="muted">{description}</Copy>{action && <Button label={action} onPress={onPress} secondary />}</Panel>;
}
export function LoadingState() {
  const { colors } = useAppTheme();
  return <Panel>
    <ActivityIndicator color={colors.accent} />
    <Copy bold>Cargando · demostración</Copy>
    <Copy tone="muted">Vista de espera. No hay ninguna solicitud en ejecución.</Copy>
  </Panel>;
}
export function ErrorState({ onRetry }: {
  onRetry: () => void;
}) { return <EmptyState title="No pudimos cargar los ejemplos" description="Error de demostración. No se ha contactado con ningún servidor." action="Volver a los resultados" onPress={onRetry} />; }
export function ConfirmationModal({ visible, title, children, onClose }: {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: 24 }}>
      <View style={{ backgroundColor: colors.surface, padding: 24, borderRadius: 24, gap: 18, maxHeight: '85%' }}>
        <Copy size={23} bold>{title}</Copy>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 12 }}>{children}</ScrollView>
        <Button secondary label="Cerrar" onPress={onClose} />
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
export function BackHome() { return <Button secondary label="Volver al inicio" onPress={() => router.replace('/')} />; }
