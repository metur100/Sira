import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { OnboardingFrame } from '@/components/content/OnboardingFrame';
import { SceneView } from '@/components/content/SceneView';
import { AppText } from '@/components/ui/AppText';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme';

/** 1 – Welcome */
export default function Welcome() {
  const { t } = useI18n();
  const { c } = useTheme();
  return (
    <OnboardingFrame step={1} title={t('onboarding.welcome.title')} body={t('onboarding.welcome.body')} onNext={() => router.push('/onboarding/seerah')}>
      <View style={styles.scene}>
        <SceneView scene={{ sky: 'night', elements: ['stars', 'crescent', 'mountains', 'dunes', 'caravan'] }} height={200} />
      </View>
      <AppText variant="heading" color={c.gold}>
        {t('app.tagline')}
      </AppText>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  scene: { borderRadius: radius.lg, overflow: 'hidden' },
});
