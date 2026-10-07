import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';

import { useTheme } from './useTheme';

/**
 * Sets the status bar style whenever the screen gains focus. Tabs stay mounted, so a static
 * <StatusBar> would keep the style of whichever screen rendered last.
 * `onDark`: the top of the screen is a dark header; otherwise follow the theme.
 */
export function useStatusBar(onDark = false) {
  const { dark } = useTheme();
  const style = onDark || dark ? 'light' : 'dark';
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(style);
    }, [style]),
  );
}
