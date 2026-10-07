import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFeedback } from '@/hooks/useFeedback';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { BookmarkType } from '@/models';
import { isBookmarked } from '@/services/engine';
import { useAppStore } from '@/store/appStore';
import { fonts, radius, spacing, TOUCH_TARGET } from '@/theme';

import { AppText } from './AppText';
import { Button, IconButton } from './Button';
import { Icon, type IconName } from './Icon';
import { PatternBackground } from './Ornament';

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  autoFocus,
  onPress,
}: {
  value: string;
  onChangeText?: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  /** When set, the bar acts as a button that opens the search screen. */
  onPress?: () => void;
}) {
  const { c, scale } = useTheme();
  const { t } = useI18n();
  const box = [styles.search, { backgroundColor: c.surface, borderColor: c.border }];
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="search" accessibilityLabel={placeholder} style={box}>
        <Icon name="search" size={20} color={c.textMuted} />
        <AppText variant="body" muted style={styles.flex}>
          {placeholder}
        </AppText>
      </Pressable>
    );
  }
  return (
    <View style={box}>
      <Icon name="search" size={20} color={c.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        style={[styles.searchInput, { color: c.text, fontSize: 16 * scale }]}
      />
      {value ? <IconButton icon="close" label={t('search.clear')} onPress={() => onChangeText?.('')} size={18} color={c.textMuted} /> : null}
    </View>
  );
}

export function FilterChip({ label, selected, onPress, icon }: { label: string; selected: boolean; onPress: () => void; icon?: IconName }) {
  const { c } = useTheme();
  const feedback = useFeedback();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={() => {
        feedback.tap();
        onPress();
      }}
      style={[styles.chip, { backgroundColor: selected ? c.primary : c.surface, borderColor: selected ? c.primary : c.border }]}
    >
      {icon ? <Icon name={icon} size={16} color={selected ? c.onPrimary : c.textMuted} /> : null}
      <AppText variant="small" color={selected ? c.onPrimary : c.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const TABS: Record<string, { icon: IconName; label: 'tabs.home' | 'tabs.timeline' | 'tabs.map' | 'tabs.explore' | 'tabs.profile' }> = {
  index: { icon: 'home', label: 'tabs.home' },
  timeline: { icon: 'timeline', label: 'tabs.timeline' },
  map: { icon: 'map', label: 'tabs.map' },
  explore: { icon: 'compass', label: 'tabs.explore' },
  profile: { icon: 'user', label: 'tabs.profile' },
};

interface BottomNavigationProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

export function BottomNavigation({ state, navigation }: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { c } = useTheme();
  const feedback = useFeedback();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm), backgroundColor: c.surface, borderTopColor: c.border }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const config = TABS[route.name];
        if (!config) return null;
        const focused = state.index === index;
        const label = t(config.label);
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                feedback.tap();
                navigation.navigate(route.name);
              }
            }}
            style={styles.tab}
          >
            <Icon name={config.icon} size={23} color={focused ? c.accent : c.textMuted} strokeWidth={focused ? 2.2 : 1.8} />
            <AppText variant="tiny" color={focused ? c.accent : c.textMuted} numberOfLines={1}>
              {label}
            </AppText>
            <View style={[styles.tabDot, { backgroundColor: focused ? c.accent : 'transparent' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

interface DialogProps {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function Dialog({ visible, title, body, confirmLabel, cancelLabel, onConfirm, onCancel, destructive }: DialogProps) {
  const { c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: c.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: c.surface, borderColor: c.border }]} accessibilityViewIsModal>
          <AppText variant="heading" accessibilityRole="header">
            {title}
          </AppText>
          <AppText variant="body" muted>
            {body}
          </AppText>
          <View style={styles.dialogActions}>
            <Button label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} />
            <Button label={cancelLabel} variant="secondary" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ToggleRow({ icon, label, description, value, onChange }: { icon: IconName; label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  const { c } = useTheme();
  return (
    <View style={styles.row}>
      <Icon name={icon} size={22} color={c.accent} />
      <View style={styles.flex}>
        <AppText variant="bodyBold">{label}</AppText>
        {description ? (
          <AppText variant="small" muted>
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ false: c.border, true: c.primary }}
        thumbColor={value ? '#FFFFFF' : c.textMuted}
      />
    </View>
  );
}

export function LinkRow({ icon, label, value, onPress, danger }: { icon: IconName; label: string; value?: string; onPress: () => void; danger?: boolean }) {
  const { c } = useTheme();
  const feedback = useFeedback();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={() => {
        feedback.tap();
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Icon name={icon} size={22} color={danger ? c.error : c.accent} />
      <AppText variant="bodyBold" color={danger ? c.error : c.text} style={styles.flex}>
        {label}
      </AppText>
      {value ? (
        <AppText variant="small" muted>
          {value}
        </AppText>
      ) : null}
      <Icon name="chevron" size={18} color={c.textMuted} />
    </Pressable>
  );
}

export function BookmarkButton({ type, id, onNight }: { type: BookmarkType; id: string; onNight?: boolean }) {
  const { c } = useTheme();
  const { t } = useI18n();
  const marked = useAppStore((s) => isBookmarked(s.app.bookmarks, type, id));
  const toggle = useAppStore((s) => s.toggleBookmark);
  return (
    <IconButton
      icon={marked ? 'bookmarkFilled' : 'bookmark'}
      label={marked ? t('bookmark.remove') : t('bookmark.add')}
      onPress={() => toggle(type, id)}
      color={marked ? (onNight ? c.gold : c.accent) : onNight ? c.onNight : c.textMuted}
    />
  );
}

/** Solid band behind the status bar so scrolled content never shows through it. */
export function StatusBarBackdrop() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return <View pointerEvents="none" style={[styles.backdropBar, { height: insets.top, backgroundColor: c.night }]} />;
}

/** Dark header band with a subtle star pattern, used at the top of the main tabs. */
export function HeroHeader({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={[c.night, '#1F2B4D']} style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
      <PatternBackground color={c.gold} />
      <View style={styles.heroContent}>{children}</View>
    </LinearGradient>
  );
}

export const inputStyle = (c: { surface: string; border: string; text: string }) => ({
  minHeight: 120,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: c.border,
  backgroundColor: c.surface,
  color: c.text,
  padding: spacing.md,
  fontFamily: fonts.regular,
  fontSize: 16,
  textAlignVertical: 'top' as const,
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 52 },
  searchInput: { flex: 1, fontFamily: fonts.regular, minHeight: 48 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, minHeight: 40 },
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm },
  tab: { flex: 1, alignItems: 'center', gap: 3, minHeight: TOUCH_TARGET + 6, justifyContent: 'center' },
  tabDot: { width: 4, height: 4, borderRadius: 2 },
  backdrop: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  dialog: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.xl, gap: spacing.md },
  dialogActions: { gap: spacing.sm, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56, paddingVertical: spacing.xs },
  backdropBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl, overflow: 'hidden' },
  heroContent: { gap: spacing.md },
});
