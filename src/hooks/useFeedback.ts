import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';

import { playSound, type SoundName } from '@/services/sound';
import { useAppStore } from '@/store/appStore';

const HAPTIC: Record<SoundName, () => Promise<void>> = {
  click: () => Haptics.selectionAsync(),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  failure: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  reward: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
};

/** Subtle sound and haptic feedback that respects the settings. */
export function useFeedback() {
  const soundEnabled = useAppStore((s) => s.app.settings.soundEnabled);
  const hapticsEnabled = useAppStore((s) => s.app.settings.hapticsEnabled);
  return useMemo(() => {
    const fire = (name: SoundName) => {
      if (soundEnabled) playSound(name);
      if (hapticsEnabled) HAPTIC[name]().catch(() => undefined);
    };
    return {
      tap: () => fire('click'),
      success: () => fire('success'),
      failure: () => fire('failure'),
      reward: () => fire('reward'),
    };
  }, [soundEnabled, hapticsEnabled]);
}
