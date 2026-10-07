import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { OnboardingFrame } from '@/components/content/OnboardingFrame';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useFeedback } from '@/hooks/useFeedback';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { LANGUAGE_NAMES } from '@/localization/i18n';
import { LANGUAGES } from '@/models';
import { useAppStore } from '@/store/appStore';
import { radius, spacing } from '@/theme';

/** 5 – Choose language */
export default function LanguageStep() {
  const { t, language } = useI18n();
  const { c } = useTheme();
  const feedback = useFeedback();
  const updateSettings = useAppStore((s) => s.updateSettings);
  return (
    <OnboardingFrame step={5} title={t('onboarding.language.title')} body={t('onboarding.language.body')} onNext={() => router.push('/onboarding/start')}>
      <View style={styles.list} accessibilityRole="radiogroup">
        {LANGUAGES.map((lang) => {
          const active = lang === language;
          return (
            <Pressable
              key={lang}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={LANGUAGE_NAMES[lang]}
              onPress={() => {
                feedback.tap();
                updateSettings({ language: lang });
              }}
              style={[styles.option, { borderColor: active ? c.gold : 'rgba(255,255,255,0.25)', backgroundColor: active ? 'rgba(201,162,77,0.18)' : 'rgba(255,255,255,0.05)' }]}
            >
              <Icon name="globe" size={22} color={active ? c.gold : c.onNightMuted} />
              <AppText variant="subheading" color={c.onNight} style={styles.flex}>
                {LANGUAGE_NAMES[lang]}
              </AppText>
              {active ? <Icon name="check" size={22} color={c.gold} strokeWidth={2.6} /> : null}
            </Pressable>
          );
        })}
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, marginTop: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 60, borderRadius: radius.md, borderWidth: 1.5, paddingHorizontal: spacing.lg },
  flex: { flex: 1 },
});
