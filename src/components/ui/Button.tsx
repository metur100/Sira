import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing, TOUCH_TARGET } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light' | 'gold';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
  compact?: boolean;
}

export function Button({ label, onPress, variant = 'primary', icon, iconRight, disabled, style, accessibilityHint, compact }: ButtonProps) {
  const { c } = useTheme();
  const feedback = useFeedback();
  const look = {
    primary: { bg: c.primary, fg: c.onPrimary, border: c.primary },
    secondary: { bg: c.surface, fg: c.text, border: c.border },
    ghost: { bg: 'transparent', fg: c.accent, border: 'transparent' },
    danger: { bg: c.error, fg: '#FFFFFF', border: c.error },
    light: { bg: 'rgba(255,255,255,0.1)', fg: c.onNight, border: 'rgba(255,255,255,0.28)' },
    // For dark headers and onboarding: always gold on night blue, in both themes.
    gold: { bg: '#D7B266', fg: '#101830', border: '#D7B266' },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        feedback.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: look.bg, borderColor: look.border, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={20} color={look.fg} /> : null}
        <AppText variant="bodyBold" color={look.fg} style={styles.label} numberOfLines={2}>
          {label}
        </AppText>
        {iconRight ? <Icon name={iconRight} size={20} color={look.fg} /> : null}
      </View>
    </Pressable>
  );
}

interface IconButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  background?: string;
  size?: number;
}

export function IconButton({ icon, label, onPress, color, background, size = 22 }: IconButtonProps) {
  const { c } = useTheme();
  const feedback = useFeedback();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        feedback.tap();
        onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: background ?? 'transparent', opacity: pressed ? 0.7 : 1 }]}
    >
      <Icon name={icon} size={size} color={color ?? c.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  compact: { minHeight: TOUCH_TARGET, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  label: { flexShrink: 1, textAlign: 'center' },
  iconButton: { width: TOUCH_TARGET, height: TOUCH_TARGET, borderRadius: TOUCH_TARGET / 2, alignItems: 'center', justifyContent: 'center' },
});
