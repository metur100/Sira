import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { OnboardingFrame } from '@/components/content/OnboardingFrame';
import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

const LOOP: { key: 'explore' | 'learn' | 'connect' | 'think' | 'remember' | 'reflect'; icon: IconName }[] = [
  { key: 'explore', icon: 'compass' },
  { key: 'learn', icon: 'book' },
  { key: 'connect', icon: 'link' },
  { key: 'think', icon: 'sparkle' },
  { key: 'remember', icon: 'refresh' },
  { key: 'reflect', icon: 'feather' },
];

/** 3 – How the application works: EXPLORE → LEARN → CONNECT → THINK → REMEMBER → REFLECT */
export default function HowItWorks() {
  const { t } = useI18n();
  const { c } = useTheme();
  return (
    <OnboardingFrame step={3} title={t('onboarding.how.title')} body={t('onboarding.how.body')} onNext={() => router.push('/onboarding/sources')}>
      <View style={styles.list}>
        {LOOP.map((s, i) => (
          <View
            key={s.key}
            style={styles.row}
            accessible
            accessibilityLabel={`${i + 1}. ${t(`onboarding.loop.${s.key}`)}: ${t(`onboarding.loop.${s.key}.desc`)}`}
          >
            <View style={[styles.icon, { borderColor: c.gold }]}>
              <Icon name={s.icon} size={20} color={c.gold} />
            </View>
            <View style={styles.flex}>
              <AppText variant="subheading" color={c.onNight}>
                {t(`onboarding.loop.${s.key}`)}
              </AppText>
              <AppText variant="small" color={c.onNightMuted}>
                {t(`onboarding.loop.${s.key}.desc`)}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 44, height: 44, borderRadius: radius.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
});
