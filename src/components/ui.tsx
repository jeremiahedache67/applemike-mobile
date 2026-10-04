import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { Text } from '@/components/text';

import { colors, fonts, radius } from '@/theme';

export type IconName = keyof typeof Ionicons.glyphMap;

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
  accessibilityLabel,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'dark' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  const fg = variant === 'outline' || variant === 'ghost' ? colors.ink950 : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        variant === 'primary' && { backgroundColor: pressed ? colors.brandDark : colors.brand },
        variant === 'dark' && { backgroundColor: pressed ? colors.ink700 : colors.ink950 },
        variant === 'outline' && { backgroundColor: pressed ? colors.ink50 : colors.white, borderWidth: 1, borderColor: colors.ink200 },
        variant === 'ghost' && { backgroundColor: pressed ? colors.ink100 : 'transparent' },
        (disabled || loading) && { opacity: 0.55 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={fg} />}
          <Text style={[s.btnText, { color: fg }]} numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color = colors.ink950,
  disabled,
  size = 48,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  color?: string;
  disabled?: boolean;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: colors.ink200, alignItems: 'center', justifyContent: 'center' },
        pressed && { backgroundColor: colors.ink50 },
        disabled && { opacity: 0.4 },
      ]}>
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}

export function Field({ label, error, hint, ...props }: TextInputProps & { label: string; error?: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.ink400}
        accessibilityLabel={label}
        {...props}
        style={[s.input, error ? s.inputError : null, props.multiline && { height: 96, paddingTop: 12, textAlignVertical: 'top' }]}
      />
      {error ? <Text style={s.error}>{error}</Text> : hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Banner({ tone = 'error', children, onRetry }: { tone?: 'error' | 'ok' | 'info'; children: React.ReactNode; onRetry?: () => void }) {
  const bg = tone === 'ok' ? colors.okSoft : tone === 'info' ? colors.ink50 : colors.brandSoft;
  const fg = tone === 'ok' ? colors.ok : tone === 'info' ? colors.ink700 : colors.brandDark;
  const icon: IconName = tone === 'ok' ? 'checkmark-circle' : tone === 'info' ? 'information-circle' : 'alert-circle';
  return (
    <View style={[s.banner, { backgroundColor: bg }]} accessibilityRole={tone === 'error' ? 'alert' : undefined}>
      <Ionicons name={icon} size={18} color={fg} />
      <Text style={{ color: fg, flex: 1, fontSize: 14, lineHeight: 20 }}>{children}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
          <Text style={{ color: fg, fontWeight: '700', fontSize: 14 }}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Ionicons name={icon} size={28} color={colors.ink500} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      {body ? <Text style={s.emptyBody}>{body}</Text> : null}
      {action ? <View style={{ marginTop: 20, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

export function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'brand' | 'dark' | 'ok' | 'amber' }) {
  const map = {
    neutral: [colors.ink100, colors.ink700],
    brand: [colors.brand, colors.white],
    dark: [colors.ink950, colors.white],
    ok: [colors.okSoft, colors.ok],
    amber: [colors.amberSoft, colors.amber],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 }}>{children}</Text>
    </View>
  );
}

export function QtyStepper({ value, max, onChange, disabled }: { value: number; max: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <View style={s.stepper} accessibilityRole="adjustable" accessibilityValue={{ min: 1, max, now: value }}>
      <Pressable onPress={() => onChange(value - 1)} disabled={disabled || value <= 1} hitSlop={6} accessibilityLabel="Decrease quantity" style={s.stepBtn}>
        <Ionicons name="remove" size={18} color={value <= 1 ? colors.ink200 : colors.ink950} />
      </Pressable>
      <Text style={s.stepValue}>{value}</Text>
      <Pressable onPress={() => onChange(value + 1)} disabled={disabled || value >= max} hitSlop={6} accessibilityLabel="Increase quantity" style={s.stepBtn}>
        <Ionicons name="add" size={18} color={value >= max ? colors.ink200 : colors.ink950} />
      </Pressable>
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={s.h2}>{children}</Text>;
}

export const s = StyleSheet.create({
  btn: { height: 50, borderRadius: radius.pill, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink900 },
  input: {
    height: 50,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.ink200,
    paddingHorizontal: 14,
    fontSize: 16, // 16px avoids iOS zoom and keeps text readable
    fontFamily: 'Inter_400Regular',
    color: colors.ink950,
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.brand, borderWidth: 1.5 },
  error: { color: colors.brandDark, fontSize: 13 },
  hint: { color: colors.ink500, fontSize: 12 },
  banner: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, alignItems: 'flex-start' },
  empty: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.ink100, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 16, fontFamily: fonts.display, fontSize: 22, color: colors.ink950, textAlign: 'center' },
  emptyBody: { marginTop: 6, fontSize: 15, color: colors.ink600, textAlign: 'center', lineHeight: 21 },
  h1: { fontFamily: fonts.display, fontSize: 28, color: colors.ink950, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.display, fontSize: 20, color: colors.ink950 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.ink200, borderRadius: radius.pill, alignSelf: 'flex-start' },
  stepBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 28, textAlign: 'center', fontWeight: '700', fontSize: 15, color: colors.ink950 },
  card: { borderRadius: radius.card, borderWidth: 1, borderColor: colors.ink100, padding: 16, backgroundColor: colors.white },
});
