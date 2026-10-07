import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button, IconButton } from '@/components/ui/Button';
import { Ornament, PatternBackground } from '@/components/ui/Ornament';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme';

export const ONBOARDING_STEPS = 6;

interface OnboardingFrameProps {
  step: number;
  title: string;
  body?: string;
  children?: React.ReactNode;
  nextLabel?: string;
  onNext: () => void;
  secondary?: React.ReactNode;
}

/** Shared night-sky layout for the six onboarding steps. */
export function OnboardingFrame({ step, title, body, children, nextLabel, onNext, secondary }: OnboardingFrameProps) {
  const { c } = useTheme();
  const { t } = useI18n();
  return (
    <LinearGradient colors={[c.night, '#1F2B4D']} style={styles.root}>
      <StatusBar style="light" />
      <PatternBackground color={c.gold} opacity={0.06} />
      <SafeAreaView style={styles.root}>
        <View style={styles.top}>
          {step > 1 ? <IconButton icon="back" label={t('common.back')} onPress={() => router.back()} color={c.onNight} /> : <View style={styles.spacer} />}
          <View style={styles.dots} accessible accessibilityLabel={t('onboarding.step', { current: step, total: ONBOARDING_STEPS })}>
            {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i < step ? c.gold : 'rgba(255,255,255,0.22)' }, i === step - 1 && styles.dotCurrent]} />
            ))}
          </View>
          <View style={styles.spacer} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppText variant="display" color={c.onNight} accessibilityRole="header">
            {title}
          </AppText>
          <Ornament color={c.gold} />
          {body ? (
            <AppText variant="body" color={c.onNightMuted}>
              {body}
            </AppText>
          ) : null}
          {children}
        </ScrollView>
        <View style={styles.footer}>
          <Button label={nextLabel ?? t('common.next')} variant="gold" iconRight="chevron" onPress={onNext} />
          {secondary}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs, minHeight: 56 },
  spacer: { width: 48 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotCurrent: { width: 22 },
  content: { padding: spacing.xl, gap: spacing.md, flexGrow: 1 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.sm },
});
