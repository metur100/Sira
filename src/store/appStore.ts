import { create } from 'zustand';

import { EPISODES, EVENTS, PEOPLE, PLACES } from '@/content';
import type { AppState, BadgeId, BookmarkType, DiscoveryType, EpisodeStep, Language, Question, Settings } from '@/models';
import {
  type AnswerMode,
  applyAnswer,
  applyDailyAnswered,
  applyDiscover,
  applyEpisodeComplete,
  applyEpisodeStep,
  applyReflection,
  applyToggleBookmark,
  createInitialState,
  type EpisodeReward,
} from '@/services/engine';
import { awardBadges, type ContentCounts } from '@/services/progress';
import { clearState, loadState, saveState } from '@/storage/persistence';

export const CONTENT_COUNTS: ContentCounts = {
  episodes: EPISODES,
  events: EVENTS.length,
  people: PEOPLE.length,
  places: PLACES.length,
};

export type EpisodeOutcome = Omit<EpisodeReward, 'state'> & { quizPoints: number };

interface AppStore {
  hydrated: boolean;
  app: AppState;
  /** Newly earned badges waiting to be shown. */
  celebrations: BadgeId[];
  celebrationsPaused: boolean;

  hydrate: (deviceLanguage: Language) => Promise<void>;
  completeOnboarding: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  recordAnswer: (question: Question, correct: boolean, mode: AnswerMode) => number;
  setEpisodeStep: (episodeId: string, step: EpisodeStep) => void;
  completeEpisode: (episodeId: string, results: boolean[], quizPoints: number) => EpisodeOutcome;
  discover: (type: DiscoveryType, ids: readonly string[]) => void;
  toggleBookmark: (type: BookmarkType, id: string) => void;
  saveReflection: (input: { questionId: string; episodeId: string; text: string; optionIndex: number | null }) => void;
  answerDaily: (day: string) => number;
  resetProgress: () => Promise<void>;
  dismissCelebration: () => void;
  setCelebrationsPaused: (paused: boolean) => void;
}

/** Applies badges and queues celebrations after every state change that can earn one. */
function commit(get: () => AppStore, set: (partial: Partial<AppStore>) => void, next: AppState) {
  const { state, newBadges } = awardBadges(next, CONTENT_COUNTS, new Date().toISOString());
  set({ app: state, celebrations: newBadges.length ? [...get().celebrations, ...newBadges] : get().celebrations });
}

export const useAppStore = create<AppStore>((set, get) => ({
  hydrated: false,
  app: createInitialState('en'),
  celebrations: [],
  celebrationsPaused: false,

  hydrate: async (deviceLanguage) => {
    const stored = await loadState();
    set({ app: stored ?? createInitialState(deviceLanguage), hydrated: true });
  },

  completeOnboarding: () => set({ app: { ...get().app, onboarded: true } }),

  updateSettings: (patch) => {
    const app = get().app;
    set({ app: { ...app, settings: { ...app.settings, ...patch } } });
  },

  recordAnswer: (question, correct, mode) => {
    const { state, points } = applyAnswer(get().app, question, correct, mode, new Date());
    commit(get, set, state);
    return points;
  },

  setEpisodeStep: (episodeId, step) => set({ app: applyEpisodeStep(get().app, episodeId, step, new Date()) }),

  completeEpisode: (episodeId, results, quizPoints) => {
    const { state, ...rest } = applyEpisodeComplete(get().app, episodeId, results, new Date());
    commit(get, set, state);
    return { ...rest, quizPoints };
  },

  discover: (type, ids) => {
    let app = get().app;
    const now = new Date();
    for (const id of ids) app = applyDiscover(app, type, id, now).state;
    if (app !== get().app) commit(get, set, app);
  },

  toggleBookmark: (type, id) => set({ app: applyToggleBookmark(get().app, type, id, new Date()) }),

  saveReflection: (input) => commit(get, set, applyReflection(get().app, input, new Date()).state),

  answerDaily: (day) => {
    const { state, points } = applyDailyAnswered(get().app, day);
    commit(get, set, state);
    return points;
  },

  resetProgress: async () => {
    const settings = get().app.settings;
    await clearState();
    set({ app: { ...createInitialState(settings.language), settings }, celebrations: [] });
  },

  dismissCelebration: () => set({ celebrations: get().celebrations.slice(1) }),
  setCelebrationsPaused: (paused) => set({ celebrationsPaused: paused }),
}));

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Persists the state shortly after every change (debounced). */
export function startAutoSave(): () => void {
  return useAppStore.subscribe((store, previous) => {
    if (!store.hydrated || store.app === previous.app) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveState(useAppStore.getState().app).catch(() => undefined);
    }, 300);
  });
}
