import { router } from 'expo-router';

import { KindLegend } from '@/components/content/Blocks';
import { OnboardingFrame } from '@/components/content/OnboardingFrame';
import { AppText } from '@/components/ui/AppText';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';

/** 4 – Sources and historical accuracy */
export default function SourcesStep() {
  const { t } = useI18n();
  const { c } = useTheme();
  return (
    <OnboardingFrame step={4} title={t('onboarding.sources.title')} body={t('onboarding.sources.body')} onNext={() => router.push('/onboarding/language')}>
      <KindLegend onNight />
      <AppText variant="small" color={c.onNightMuted}>
        {t('onboarding.sources.note')}
      </AppText>
    </OnboardingFrame>
  );
}
