import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { useAppStore } from '@/store/appStore';
import { type Palette, palette } from '@/theme';

export interface ThemeInfo {
  c: Palette;
  dark: boolean;
  /** Font scale for the large-text setting (system font scaling still applies on top). */
  scale: number;
  reducedMotion: boolean;
}

/** Current colours according to the dark-mode and accessibility settings. */
export function useTheme(): ThemeInfo {
  const system = useColorScheme();
  const mode = useAppStore((s) => s.app.settings.themeMode);
  const contrast = useAppStore((s) => s.app.settings.highContrast);
  const largeText = useAppStore((s) => s.app.settings.largeText);
  const reducedMotion = useAppStore((s) => s.app.settings.reducedMotion);
  const dark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return useMemo(
    () => ({ c: palette(dark, contrast), dark, scale: largeText ? 1.18 : 1, reducedMotion }),
    [dark, contrast, largeText, reducedMotion],
  );
}

/** Creates styles from the current palette, recomputed only when the theme changes. */
export function useStyles<T>(factory: (c: Palette) => T): T {
  const { c } = useTheme();
  return useMemo(() => factory(c), [c, factory]);
}
