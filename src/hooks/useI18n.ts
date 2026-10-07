import { useCallback } from 'react';

import { localize, translate, type TranslationKey } from '@/localization/i18n';
import type { LocalizedText } from '@/models';
import { useAppStore } from '@/store/appStore';

/** Translation helpers bound to the reader's current language. */
export function useI18n() {
  const language = useAppStore((s) => s.app.settings.language);
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => translate(language, key, params),
    [language],
  );
  const l = useCallback((text: LocalizedText | undefined | null) => localize(text ?? undefined, language), [language]);
  return { t, l, language };
}
