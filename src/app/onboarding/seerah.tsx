import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { OnboardingFrame } from '@/components/content/OnboardingFrame';
import { SceneView } from '@/components/content/SceneView';
import { AppText } from '@/components/ui/AppText';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme';

/** 2 – What is the Seerah? */
export default function WhatIsSeerah() {
  const { t } = useI18n();
  const { c } = useTheme();
  return (
    <OnboardingFrame step={2} title={t('onboarding.seerah.title')} body={t('onboarding.seerah.body')} onNext={() => router.push('/onboarding/how')}>
      <AppText variant="title" color={c.gold} script="arabic" align="center">
        السيرة النبوية
      </AppText>
      <View style={styles.scene}>
        <SceneView scene={{ sky: 'dawn', elements: ['mountains', 'city', 'kaaba'] }} height={150} />
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  scene: { borderRadius: radius.lg, overflow: 'hidden' },
});
