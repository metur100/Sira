import { Modal, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { star8 } from '@/components/ui/Ornament';
import { useFeedback } from '@/hooks/useFeedback';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { BadgeId } from '@/models';
import { BADGES } from '@/services/progress';
import { useAppStore } from '@/store/appStore';
import { radius, spacing } from '@/theme';

const ICON_FOR: Record<string, IconName> = {
  compass: 'compass',
  kaaba: 'kaaba',
  mosque: 'mosque',
  timeline: 'timeline',
  people: 'people',
  feather: 'feather',
  book: 'book',
  star: 'star',
};

/** Explorer badge: an eight-pointed star medallion – no randomness, no loot. */
export function BadgeIcon({ id, earned, size = 64 }: { id: BadgeId; earned: boolean; size?: number }) {
  const { c } = useTheme();
  const def = BADGES.find((b) => b.id === id);
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path d={star8(32, 32, 30)} fill={earned ? c.gold : c.surfaceAlt} stroke={earned ? c.accent : c.border} strokeWidth={1.5} />
        <Path d={star8(32, 32, 21)} fill={earned ? c.night : c.surface} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Icon name={ICON_FOR[def?.icon ?? 'star'] ?? 'star'} size={size * 0.34} color={earned ? c.gold : c.textMuted} />
      </View>
    </View>
  );
}

/** Shows newly earned badges one at a time (paused during quizzes). */
export function CelebrationOverlay() {
  const { c } = useTheme();
  const { t } = useI18n();
  const feedback = useFeedback();
  const next = useAppStore((s) => (s.celebrationsPaused ? undefined : s.celebrations[0]));
  const dismiss = useAppStore((s) => s.dismissCelebration);
  if (!next) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss} onShow={() => feedback.reward()}>
      <View style={[styles.backdrop, { backgroundColor: c.overlay }]}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]} accessibilityViewIsModal>
          <AppText variant="label" color={c.accent}>
            {t('celebrate.title')}
          </AppText>
          <BadgeIcon id={next} earned size={96} />
          <AppText variant="title" align="center">
            {t(`badge.${next}.name`)}
          </AppText>
          <AppText variant="body" muted align="center">
            {t(`badge.${next}.desc`)}
          </AppText>
          <Button label={t('common.continue')} onPress={dismiss} style={styles.button} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  card: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  button: { alignSelf: 'stretch' },
});
