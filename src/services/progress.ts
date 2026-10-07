import type { AppState, BadgeId, Episode } from '@/models';

import { GOOD_SCORE_PERCENT } from './quiz';

export interface ContentCounts {
  episodes: readonly Episode[];
  events: number;
  people: number;
  places: number;
}

export interface Exploration {
  episodesCompleted: number;
  episodesTotal: number;
  eventsDiscovered: number;
  peopleDiscovered: number;
  placesDiscovered: number;
  /** 0..100 – share of all episodes, events, people and places explored. */
  explored: number;
  bookmarks: number;
  reflections: number;
}

export function completedEpisodes(state: AppState): string[] {
  return Object.entries(state.episodes)
    .filter(([, p]) => p.completedAt)
    .map(([id]) => id);
}

export function exploration(state: AppState, content: ContentCounts): Exploration {
  const episodesCompleted = completedEpisodes(state).filter((id) => content.episodes.some((e) => e.id === id)).length;
  const eventsDiscovered = Object.keys(state.discovered.event).length;
  const peopleDiscovered = Object.keys(state.discovered.person).length;
  const placesDiscovered = Object.keys(state.discovered.place).length;
  const total = content.episodes.length + content.events + content.people + content.places;
  const done =
    episodesCompleted +
    Math.min(eventsDiscovered, content.events) +
    Math.min(peopleDiscovered, content.people) +
    Math.min(placesDiscovered, content.places);
  return {
    episodesCompleted,
    episodesTotal: content.episodes.length,
    eventsDiscovered,
    peopleDiscovered,
    placesDiscovered,
    explored: total === 0 ? 0 : Math.round((done / total) * 100),
    bookmarks: state.bookmarks.length,
    reflections: Object.keys(state.reflections).length,
  };
}

/** The next episode to continue: the one in progress, otherwise the first not completed. */
export function continueEpisode(state: AppState, episodes: readonly Episode[]): Episode | null {
  const last = state.lastEpisodeId ? episodes.find((e) => e.id === state.lastEpisodeId) : undefined;
  if (last && !state.episodes[last.id]?.completedAt) return last;
  return episodes.find((e) => !state.episodes[e.id]?.completedAt) ?? null;
}

// ---------- Badges ----------

export const BADGES: readonly { id: BadgeId; icon: string }[] = [
  { id: 'first_journey', icon: 'compass' },
  { id: 'makkah_explorer', icon: 'kaaba' },
  { id: 'madinah_explorer', icon: 'mosque' },
  { id: 'timeline_explorer', icon: 'timeline' },
  { id: 'history_seeker', icon: 'people' },
  { id: 'reflective_mind', icon: 'feather' },
  { id: 'seerah_student', icon: 'book' },
  { id: 'ten_episodes', icon: 'star' },
];

export const REFLECTIVE_MIND_COUNT = 5;
export const SEERAH_STUDENT_EPISODES = 5;

export function isBadgeEarned(id: BadgeId, state: AppState, content: ContentCounts): boolean {
  const done = new Set(completedEpisodes(state));
  const eraDone = (era: Episode['era'][]) => {
    const list = content.episodes.filter((e) => era.includes(e.era));
    return list.length > 0 && list.every((e) => done.has(e.id));
  };
  switch (id) {
    case 'first_journey':
      return done.size >= 1;
    case 'makkah_explorer':
      return eraDone(['before', 'makkah']);
    case 'madinah_explorer':
      return eraDone(['madinah']);
    case 'timeline_explorer':
      return Object.keys(state.discovered.event).length >= content.events;
    case 'history_seeker':
      return Object.keys(state.discovered.person).length >= content.people;
    case 'reflective_mind':
      return Object.keys(state.reflections).length >= REFLECTIVE_MIND_COUNT;
    case 'seerah_student':
      return Object.values(state.episodes).filter((p) => p.completedAt && (p.bestScore ?? 0) >= GOOD_SCORE_PERCENT).length >= SEERAH_STUDENT_EPISODES;
    case 'ten_episodes':
      return content.episodes.length > 0 && content.episodes.every((e) => done.has(e.id));
  }
}

export function awardBadges(state: AppState, content: ContentCounts, nowIso: string): { state: AppState; newBadges: BadgeId[] } {
  const newBadges = BADGES.map((b) => b.id).filter((id) => !state.badges[id] && isBadgeEarned(id, state, content));
  if (newBadges.length === 0) return { state, newBadges };
  const badges = { ...state.badges };
  for (const id of newBadges) badges[id] = nowIso;
  return { state: { ...state, badges }, newBadges };
}
