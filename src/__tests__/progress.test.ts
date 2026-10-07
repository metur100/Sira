import AsyncStorage from '@react-native-async-storage/async-storage';

import { EPISODES, EVENTS, PEOPLE, PLACES, QUESTIONS } from '@/content';
import bs from '@/localization/bs';
import de from '@/localization/de';
import en from '@/localization/en';
import { languageFromLocale, translate } from '@/localization/i18n';
import {
  applyAnswer,
  applyDailyAnswered,
  applyDiscover,
  applyEpisodeComplete,
  applyEpisodeStep,
  applyReflection,
  applyToggleBookmark,
  createInitialState,
  isBookmarked,
  STATE_VERSION,
} from '@/services/engine';
import { awardBadges, continueEpisode, exploration } from '@/services/progress';
import { dueItems, isDue, MAX_BOX, recordMistake, recordSuccess, reviewCenter } from '@/services/review';
import { clearState, loadState, migrateState, saveState, STORAGE_KEY } from '@/storage/persistence';
import { CONTENT_COUNTS, useAppStore } from '@/store/appStore';

const NOW = new Date('2026-10-07T10:00:00.000Z');
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

describe('review system', () => {
  it('moves items through the boxes until mastered', () => {
    let item = recordMistake(undefined, 'q', 'episode-01', NOW.toISOString());
    expect(isDue(item, NOW.toISOString())).toBe(true);
    item = recordSuccess(item, NOW.toISOString());
    expect(item.box).toBe(1);
    expect(isDue(item, NOW.toISOString())).toBe(false);
    expect(isDue(item, day(1))).toBe(true);
    for (let i = 0; i < MAX_BOX; i++) item = recordSuccess(item, day(30));
    expect(item.mastered).toBe(true);
  });

  it('builds the Review Center categories', () => {
    let state = createInitialState();
    state = applyAnswer(state, QUESTIONS[0], false, 'quiz', NOW).state;
    state = applyAnswer(state, QUESTIONS[1], false, 'quiz', NOW).state;
    state = applyAnswer(state, QUESTIONS[1], false, 'quiz', NOW).state;
    const center = reviewCenter(state.review, NOW.toISOString());
    expect(center.dueCount).toBe(2);
    expect(center.needsReview[0].questionId).toBe(QUESTIONS[1].id); // missed twice → first
    expect(center.mastered).toEqual([]);
    const reviewed = applyAnswer(state, QUESTIONS[0], true, 'review', NOW);
    expect(reviewed.points).toBe(5);
    expect(dueItems(reviewed.state.review, NOW.toISOString())).toHaveLength(1);
  });
});

describe('progress', () => {
  it('tracks episodes, discoveries and the explored percentage', () => {
    let state = createInitialState();
    expect(exploration(state, CONTENT_COUNTS).explored).toBe(0);
    state = applyEpisodeComplete(state, 'episode-01', [true], NOW).state;
    state = applyDiscover(state, 'place', 'makkah', NOW).state;
    state = applyDiscover(state, 'person', 'khadijah', NOW).state;
    const e = exploration(state, CONTENT_COUNTS);
    expect(e.episodesCompleted).toBe(1);
    expect(e.placesDiscovered).toBe(1);
    const total = EPISODES.length + EVENTS.length + PEOPLE.length + PLACES.length;
    expect(e.explored).toBe(Math.round((3 / total) * 100));
    expect(applyDiscover(state, 'place', 'makkah', NOW).points).toBe(0);
  });

  it('continues the episode in progress, otherwise the next unfinished one', () => {
    let state = createInitialState();
    expect(continueEpisode(state, EPISODES)?.id).toBe('episode-01');
    state = applyEpisodeStep(state, 'episode-04', 'mainEvent', NOW);
    expect(continueEpisode(state, EPISODES)?.id).toBe('episode-04');
    state = applyEpisodeComplete(state, 'episode-04', [true], NOW).state;
    expect(continueEpisode(state, EPISODES)?.id).toBe('episode-01');
  });

  it('awards badges once', () => {
    let state = applyEpisodeComplete(createInitialState(), 'episode-01', [true], NOW).state;
    const first = awardBadges(state, CONTENT_COUNTS, NOW.toISOString());
    expect(first.newBadges).toEqual(['first_journey']);
    expect(awardBadges(first.state, CONTENT_COUNTS, NOW.toISOString()).newBadges).toEqual([]);
    for (const ep of EPISODES) state = applyEpisodeComplete(state, ep.id, [true, true], NOW).state;
    const all = awardBadges(state, CONTENT_COUNTS, NOW.toISOString()).newBadges;
    expect(all).toEqual(expect.arrayContaining(['makkah_explorer', 'madinah_explorer', 'seerah_student', 'ten_episodes']));
  });
});

describe('bookmarks and reflections', () => {
  it('toggles bookmarks of every type', () => {
    let state = createInitialState();
    for (const type of ['episode', 'event', 'person', 'place', 'source'] as const) {
      state = applyToggleBookmark(state, type, 'x', NOW);
      expect(isBookmarked(state.bookmarks, type, 'x')).toBe(true);
    }
    state = applyToggleBookmark(state, 'person', 'x', NOW);
    expect(isBookmarked(state.bookmarks, 'person', 'x')).toBe(false);
    expect(state.bookmarks).toHaveLength(4);
  });

  it('saves, updates and removes reflections without judging them', () => {
    let r = applyReflection(createInitialState(), { questionId: 'e01-r1', episodeId: 'episode-01', text: '  My thought  ', optionIndex: null }, NOW);
    expect(r.state.reflections['e01-r1'].text).toBe('My thought');
    expect(r.points).toBe(5);
    r = applyReflection(r.state, { questionId: 'e01-r1', episodeId: 'episode-01', text: '', optionIndex: 2 }, NOW);
    expect(r.points).toBe(0);
    expect(r.state.reflections['e01-r1'].optionIndex).toBe(2);
    r = applyReflection(r.state, { questionId: 'e01-r1', episodeId: 'episode-01', text: '', optionIndex: null }, NOW);
    expect(r.state.reflections['e01-r1']).toBeUndefined();
  });

  it('rewards the daily question once per day', () => {
    const first = applyDailyAnswered(createInitialState(), '2026-10-07');
    expect(first.points).toBe(10);
    expect(applyDailyAnswered(first.state, '2026-10-07').points).toBe(0);
  });
});

describe('persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips the full state', async () => {
    let state = createInitialState('bs');
    state = applyEpisodeComplete(state, 'episode-02', [true, false], NOW).state;
    state = applyToggleBookmark(state, 'place', 'badr', NOW);
    state = applyReflection(state, { questionId: 'e02-r1', episodeId: 'episode-02', text: 'Učiti', optionIndex: null }, NOW).state;
    await saveState(state);
    expect(await loadState()).toEqual(state);
  });

  it('survives corrupt or future data and fills defaults', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, '{oops');
    expect(await loadState()).toBeNull();
    expect(migrateState({ version: STATE_VERSION + 1 })).toBeNull();
    const migrated = migrateState({ version: 1, points: 7, settings: { language: 'de' } })!;
    expect(migrated.points).toBe(7);
    expect(migrated.settings.themeMode).toBe('system');
    expect(migrated.discovered).toEqual({ event: {}, person: {}, place: {} });
    await saveState(createInitialState());
    await clearState();
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('store hydrates, celebrates badges and resets but keeps settings', async () => {
    await useAppStore.getState().hydrate('de');
    expect(useAppStore.getState().app.settings.language).toBe('de');
    useAppStore.getState().completeEpisode('episode-01', [true], 0);
    expect(useAppStore.getState().celebrations).toContain('first_journey');
    useAppStore.getState().updateSettings({ themeMode: 'dark' });
    await useAppStore.getState().resetProgress();
    expect(useAppStore.getState().app.episodes).toEqual({});
    expect(useAppStore.getState().app.settings.themeMode).toBe('dark');
  });
});

describe('localization', () => {
  const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();

  it('has every key in every language with the same placeholders', () => {
    for (const dict of [de, bs]) {
      expect(Object.keys(dict).sort()).toEqual(Object.keys(en).sort());
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        expect(dict[key].trim().length).toBeGreaterThan(0);
        expect({ key, p: placeholders(dict[key]) }).toEqual({ key, p: placeholders(en[key]) });
      }
    }
  });

  it('translates and maps device locales', () => {
    expect(translate('de', 'episode.label', { number: 3 })).toBe('Episode 3');
    expect(translate('bs', 'home.episodes', { done: 4, total: 10 })).toBe('4 / 10 epizoda');
    expect(languageFromLocale('hr')).toBe('bs');
    expect(languageFromLocale('de')).toBe('de');
    expect(languageFromLocale('fr')).toBe('en');
  });
});
