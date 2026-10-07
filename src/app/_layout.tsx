import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { getLocales } from 'expo-localization';
import { type ErrorBoundaryProps, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CelebrationOverlay } from '@/components/content/Badges';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { languageFromLocale, translate } from '@/localization/i18n';
import { configureNotificationHandler, syncReminder } from '@/services/notifications';
import { startAutoSave, useAppStore } from '@/store/appStore';
import { palette } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
configureNotificationHandler();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Lora_600SemiBold,
    Lora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Amiri_400Regular,
    Amiri_700Bold,
  });
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const reminder = useAppStore((s) => s.app.settings.reminderEnabled);
  const reminderHour = useAppStore((s) => s.app.settings.reminderHour);
  const language = useAppStore((s) => s.app.settings.language);
  const { c } = useTheme();

  useEffect(() => {
    const stop = startAutoSave();
    hydrate(languageFromLocale(getLocales()[0]?.languageCode)).catch(() => undefined);
    return stop;
  }, [hydrate]);

  const ready = hydrated && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  // Keep the optional daily reminder in sync with the settings and language.
  useEffect(() => {
    if (hydrated) void syncReminder(reminder, reminderHour, language);
  }, [hydrated, reminder, reminderHour, language]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: '#101830' }} />;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background }, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="episode/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="source/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      <CelebrationOverlay />
    </SafeAreaProvider>
  );
}

/** Shown if a screen crashes; progress is stored separately and stays safe. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const settings = useAppStore.getState().app.settings;
  const c = palette(settings.themeMode === 'dark', settings.highContrast);
  return (
    <View style={{ flex: 1, backgroundColor: c.background, justifyContent: 'center', padding: 24, gap: 16 }}>
      <AppText variant="title" align="center">
        {translate(settings.language, 'error.title')}
      </AppText>
      <AppText variant="body" align="center" muted>
        {translate(settings.language, 'error.body')}
      </AppText>
      <Button label={translate(settings.language, 'common.retry')} onPress={retry} />
    </View>
  );
}
