import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Dialog, FilterChip, LinkRow, ToggleRow } from '@/components/ui/Controls';
import { HistoricalCard, Screen, TopBar } from '@/components/ui/Layout';
import { useI18n } from '@/hooks/useI18n';
import { LANGUAGE_NAMES, LOCALE_TAGS } from '@/localization/i18n';
import { LANGUAGES, type ThemeMode } from '@/models';
import { ensurePermission } from '@/services/notifications';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme';

const HOURS = [7, 12, 18, 21];
const MODES: ThemeMode[] = ['system', 'light', 'dark'];

export default function SettingsScreen() {
  const { t, language } = useI18n();
  const settings = useAppStore((s) => s.app.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetProgress = useAppStore((s) => s.resetProgress);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const time = (hour: number) => new Date(2000, 0, 1, hour).toLocaleTimeString(LOCALE_TAGS[language], { hour: '2-digit', minute: '2-digit' });

  const toggleReminder = async (value: boolean) => {
    setNotice(null);
    if (value) {
      const permission = await ensurePermission(language);
      if (permission !== 'granted') {
        setNotice(permission === 'denied' ? t('settings.notifDenied') : t('settings.notifUnavailable'));
        return;
      }
    }
    updateSettings({ reminderEnabled: value });
  };

  return (
    <Screen header={<TopBar title={t('settings.title')} />}>
      <Section title={t('settings.general')}>
        <AppText variant="bodyBold">{t('settings.language')}</AppText>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {LANGUAGES.map((lang) => (
            <FilterChip key={lang} label={LANGUAGE_NAMES[lang]} selected={settings.language === lang} onPress={() => updateSettings({ language: lang })} />
          ))}
        </View>
        <ToggleRow icon="sparkle" label={t('settings.sound')} value={settings.soundEnabled} onChange={(v) => updateSettings({ soundEnabled: v })} />
        <ToggleRow icon="sparkle" label={t('settings.haptics')} value={settings.hapticsEnabled} onChange={(v) => updateSettings({ hapticsEnabled: v })} />
      </Section>

      <Section title={t('settings.appearance')}>
        <AppText variant="bodyBold">{t('settings.theme')}</AppText>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {MODES.map((mode) => (
            <FilterChip
              key={mode}
              icon={mode === 'dark' ? 'moon' : mode === 'light' ? 'sun' : 'eye'}
              label={t(`settings.theme.${mode}`)}
              selected={settings.themeMode === mode}
              onPress={() => updateSettings({ themeMode: mode })}
            />
          ))}
        </View>
      </Section>

      <Section title={t('settings.notifications')}>
        <ToggleRow icon="bell" label={t('settings.reminder')} description={t('settings.reminderDesc')} value={settings.reminderEnabled} onChange={toggleReminder} />
        {settings.reminderEnabled ? (
          <>
            <AppText variant="small" muted>
              {t('settings.reminderTime', { time: time(settings.reminderHour) })}
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {HOURS.map((h) => (
                <FilterChip key={h} label={time(h)} selected={settings.reminderHour === h} onPress={() => updateSettings({ reminderHour: h })} />
              ))}
            </ScrollView>
          </>
        ) : null}
        {notice ? (
          <AppText variant="small" accessibilityLiveRegion="polite">
            {notice}
          </AppText>
        ) : null}
      </Section>

      <Section title={t('settings.accessibility')}>
        <ToggleRow icon="text" label={t('settings.largeText')} value={settings.largeText} onChange={(v) => updateSettings({ largeText: v })} />
        <ToggleRow icon="eye" label={t('settings.highContrast')} value={settings.highContrast} onChange={(v) => updateSettings({ highContrast: v })} />
        <ToggleRow icon="shield" label={t('settings.reducedMotion')} value={settings.reducedMotion} onChange={(v) => updateSettings({ reducedMotion: v })} />
      </Section>

      <Section title={t('settings.info')}>
        <LinkRow icon="info" label={t('settings.about')} onPress={() => router.push({ pathname: '/info/[page]', params: { page: 'about' } })} />
        <LinkRow icon="shield" label={t('settings.privacy')} onPress={() => router.push({ pathname: '/info/[page]', params: { page: 'privacy' } })} />
        <LinkRow icon="book" label={t('settings.sources')} onPress={() => router.push({ pathname: '/info/[page]', params: { page: 'sources' } })} />
      </Section>

      <Section title={t('settings.data')}>
        <LinkRow icon="trash" label={t('settings.reset')} onPress={() => setConfirmReset(true)} danger />
        <AppText variant="small" muted>
          {t('settings.resetDesc')}
        </AppText>
      </Section>

      <AppText variant="tiny" muted align="center">
        {t('app.name')} · {t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
      </AppText>

      <Dialog
        visible={confirmReset}
        title={t('settings.resetTitle')}
        body={t('settings.resetBody')}
        confirmLabel={t('settings.resetConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          setConfirmReset(false);
          await resetProgress();
          router.replace('/onboarding');
        }}
      />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="label" muted accessibilityRole="header">
        {title}
      </AppText>
      <HistoricalCard>{children}</HistoricalCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
