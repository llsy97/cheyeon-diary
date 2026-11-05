import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, space, TOUCH } from '@/theme';

type Weight = 'regular' | 'medium' | 'bold';

export function Txt({
  weight = 'regular',
  size = 15,
  color = colors.text,
  style,
  ...rest
}: TextProps & { weight?: Weight; size?: number; color?: string }) {
  return (
    <Text
      {...rest}
      style={[{ fontFamily: fonts[weight], fontSize: size, color, lineHeight: Math.round(size * 1.45) }, style]}
    />
  );
}

/** 탭 화면 공통 틀: 안전 영역 + 스크롤 + 큰 제목 */
export function Screen({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + space.lg,
        paddingHorizontal: space.lg,
        paddingBottom: space.xxl * 2,
        gap: space.md,
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          {subtitle ? (
            <Txt size={13} color={colors.subtext}>
              {subtitle}
            </Txt>
          ) : null}
          <Txt weight="bold" size={24}>
            {title}
          </Txt>
        </View>
        {right}
      </View>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.cardTitle}>
      <Txt weight="bold" size={16} style={{ flex: 1 }}>
        {children}
      </Txt>
      {right}
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
  icon,
  style,
  ...rest
}: Omit<PressableProps, 'style'> & {
  label: string;
  variant?: 'primary' | 'soft' | 'ghost';
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = variant === 'primary' ? colors.point : variant === 'soft' ? colors.pointSoft : 'transparent';
  const fg = variant === 'primary' ? colors.white : colors.point;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        style,
      ]}
      {...rest}
    >
      {icon}
      <Txt weight="bold" size={15} color={fg}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function Chip({
  label,
  onPress,
  active,
  icon,
  textStyle,
}: {
  label: string;
  onPress?: () => void;
  active?: boolean;
  icon?: ReactNode;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.pointSoft : colors.bg,
          borderColor: active ? colors.point : colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {icon}
      <Txt size={14} weight="medium" color={active ? colors.point : colors.subtext} style={textStyle}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function ProgressBar({ value, height = 10 }: { value: number; height?: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      style={{ height, borderRadius: height, backgroundColor: colors.heat[0], overflow: 'hidden' }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
    >
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: colors.point, borderRadius: height }} />
    </View>
  );
}

export function IconButton({
  onPress,
  children,
  label,
  disabled,
}: {
  onPress: () => void;
  children: ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.iconButton, { opacity: disabled ? 0.3 : pressed ? 0.5 : 1 }]}
    >
      {children}
    </Pressable>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: space.xs, gap: space.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: space.lg + 2, gap: space.md },
  cardTitle: { flexDirection: 'row', alignItems: 'center', minHeight: 24 },
  button: {
    minHeight: TOUCH + 4,
    paddingHorizontal: space.lg,
    borderRadius: radius.field,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  chip: {
    minHeight: TOUCH,
    paddingHorizontal: 14,
    borderRadius: radius.chip,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
});
