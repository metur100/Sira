import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppState } from '@/models';
import { createInitialState, STATE_VERSION } from '@/services/engine';

export const STORAGE_KEY = 'sira:state';

/** Brings stored data up to the current shape; missing fields fall back to defaults. */
export function migrateState(raw: unknown): AppState | null {
  if (!raw || typeof raw !== 'object') return null;
  const stored = raw as Partial<AppState>;
  if (typeof stored.version !== 'number' || stored.version > STATE_VERSION) return null;
  const base = createInitialState(stored.settings?.language ?? 'en');
  return {
    ...base,
    ...stored,
    version: STATE_VERSION,
    settings: { ...base.settings, ...stored.settings },
    discovered: { ...base.discovered, ...stored.discovered },
    bookmarks: Array.isArray(stored.bookmarks) ? stored.bookmarks : [],
    quizResults: Array.isArray(stored.quizResults) ? stored.quizResults : [],
  };
}

export async function loadState(): Promise<AppState | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return migrateState(JSON.parse(json));
  } catch {
    // Corrupt data must never crash the app; the reader starts fresh instead.
    return null;
  }
}

export async function saveState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
