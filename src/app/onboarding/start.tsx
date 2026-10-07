import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { OnboardingFrame } from '@/components/content/OnboardingFrame';
import { SceneView } from '@/components/content/SceneView';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/hooks/useI18n';
import { useAppStore } from '@/store/appStore';
import { radius } from '@/theme';

/** 6 – Start journey */
export default function StartStep() {
  const { t } = useI18n();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const finish = (openFirst: boolean) => {
    completeOnboarding();
    router.replace('/(tabs)');
    if (openFirst) router.push({ pathname: '/episode/[id]', params: { id: 'episode-01' } });
  };

  return (
    <OnboardingFrame
      step={6}
      title={t('onboarding.start.title')}
      body={t('onboarding.start.body')}
      nextLabel={t('onboarding.start.cta')}
      onNext={() => finish(true)}
      secondary={<Button label={t('onboarding.start.later')} variant="light" onPress={() => finish(false)} />}
    >
      <View style={styles.scene}>
        <SceneView scene={{ sky: 'dawn', elements: ['stars', 'mountains', 'city', 'kaaba'] }} height={180} />
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  scene: { borderRadius: radius.lg, overflow: 'hidden' },
});
