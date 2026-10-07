import { router } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useI18n } from '@/hooks/useI18n';
import { useFeedback } from '@/hooks/useFeedback';
import { useStatusBar } from '@/hooks/useStatusBar';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { IconButton } from './Button';
import { Icon, type IconName } from './Icon';
import { Ornament } from './Ornament';

interface ScreenProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
}

/** Standard screen: themed background, safe areas, scrolling content. */
export function Screen({ children, header, footer, scroll = true, edges = ['top', 'left', 'right'], contentStyle, scrollEnabled = true }: ScreenProps) {
  const { c } = useTheme();
  useStatusBar();
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: c.background }]} edges={edges}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        {scroll ? (
          <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled" scrollEnabled={scrollEnabled}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.fill, contentStyle]}>{children}</View>
        )}
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface TopBarProps {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  backIcon?: IconName;
}

export function TopBar({ title, onBack, right, backIcon = 'back' }: TopBarProps) {
  const { t } = useI18n();
  const { c } = useTheme();
  return (
    <View style={styles.topBar}>
      <IconButton icon={backIcon} label={t('a11y.back')} onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} />
      <AppText variant="subheading" style={styles.topTitle} numberOfLines={1} accessibilityRole="header" color={c.text}>
        {title ?? ''}
      </AppText>
      <View style={styles.topRight}>{right}</View>
    </View>
  );
}

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'alt' | 'gold' | 'night';
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/** HistoricalCard: the base surface for content cards. */
export function HistoricalCard({ children, onPress, style, tone = 'default', accessibilityLabel, accessibilityHint }: CardProps) {
  const { c } = useTheme();
  const feedback = useFeedback();
  const bg = { default: c.surface, alt: c.surfaceAlt, gold: c.goldSoft, night: c.night }[tone];
  const border = tone === 'night' ? c.night : c.border;
  const base = [styles.card, { backgroundColor: bg, borderColor: border }, style];
  if (!onPress) {
    return (
      <View style={base} accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={() => {
        feedback.tap();
        onPress();
      }}
      style={({ pressed }) => [base, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

interface ChapterHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  onNight?: boolean;
}

/** Section title with a small geometric ornament. */
export function ChapterHeader({ label, title, subtitle, onNight }: ChapterHeaderProps) {
  const { c } = useTheme();
  return (
    <View style={styles.chapter}>
      {label ? (
        <AppText variant="label" color={onNight ? c.gold : c.accent}>
          {label}
        </AppText>
      ) : null}
      <AppText variant="title" color={onNight ? c.onNight : c.text} accessibilityRole="header">
        {title}
      </AppText>
      <Ornament color={onNight ? c.gold : c.accent} />
      {subtitle ? (
        <AppText variant="body" color={onNight ? c.onNightMuted : c.textMuted}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

interface SectionTitleProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionTitle({ title, actionLabel, onAction }: SectionTitleProps) {
  const { c } = useTheme();
  return (
    <View style={styles.sectionRow}>
      <AppText variant="heading" accessibilityRole="header" style={styles.flex}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel} hitSlop={8} style={styles.sectionAction}>
          <AppText variant="small" color={c.accent}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ProgressBar({ progress, color, label, height = 8, onDark }: { progress: number; color?: string; label?: string; height?: number; onDark?: boolean }) {
  const { c, t } = { ...useTheme(), ...useI18n() };
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? t('a11y.progress', { percent })}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={[styles.track, { height, backgroundColor: onDark ? 'rgba(255,255,255,0.16)' : c.surfaceAlt, borderRadius: height / 2 }]}
    >
      <View style={{ width: `${percent}%`, height: '100%', backgroundColor: color ?? c.accent, borderRadius: height / 2 }} />
    </View>
  );
}

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'compass', title, body, actionLabel, onAction }: EmptyStateProps) {
  const { c } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: c.goldSoft }]}>
        <Icon name={icon} size={28} color={c.accent} />
      </View>
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      {body ? (
        <AppText variant="body" muted align="center">
          {body}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" style={[styles.emptyAction, { borderColor: c.border }]}>
          <AppText variant="bodyBold" color={c.accent}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.lg },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xs, minHeight: 56 },
  topTitle: { flex: 1, textAlign: 'center' },
  topRight: { minWidth: 48, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end' },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  chapter: { gap: spacing.xs },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionAction: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.xs },
  track: { width: '100%', overflow: 'hidden' },
  empty: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyAction: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.lg, minHeight: 48, justifyContent: 'center' },
});
