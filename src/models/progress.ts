import type { DayKey, Language } from './common';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Settings {
  language: Language;
  themeMode: ThemeMode;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  /** Optional daily "Today's Seerah" reminder. */
  reminderEnabled: boolean;
  reminderHour: number;
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

export type EpisodeStep =
  | 'introduction'
  | 'context'
  | 'timeline'
  | 'mainEvent'
  | 'people'
  | 'locations'
  | 'explore'
  | 'challenge'
  | 'lesson'
  | 'reflection'
  | 'sources';

export interface EpisodeProgress {
  /** Last step reached, so the journey can be continued. */
  step: EpisodeStep;
  startedAt: string;
  completedAt: string | null;
  bestScore: number | null;
}

export interface QuizResult {
  episodeId: string;
  correct: number;
  total: number;
  percent: number;
  date: string;
}

export interface ReviewItem {
  questionId: string;
  episodeId: string;
  box: number;
  correctCount: number;
  incorrectCount: number;
  lastSeen: string;
  nextReviewDate: string;
  mastered: boolean;
}

export type BookmarkType = 'episode' | 'event' | 'person' | 'place' | 'source';

export interface Bookmark {
  type: BookmarkType;
  id: string;
  createdAt: string;
}

export interface Reflection {
  questionId: string;
  episodeId: string;
  /** Free text written by the reader (never judged). */
  text: string;
  /** Index of a chosen ready-made reflection, if any. */
  optionIndex: number | null;
  updatedAt: string;
}

export type DiscoveryType = 'event' | 'person' | 'place';

export type BadgeId =
  | 'first_journey'
  | 'makkah_explorer'
  | 'madinah_explorer'
  | 'timeline_explorer'
  | 'history_seeker'
  | 'reflective_mind'
  | 'seerah_student'
  | 'ten_episodes';

export interface AppState {
  version: number;
  onboarded: boolean;
  settings: Settings;
  /** Knowledge points – earned once per item, never randomly. */
  points: number;
  episodes: Record<string, EpisodeProgress>;
  lastEpisodeId: string | null;
  quizResults: QuizResult[];
  correctlyAnswered: string[];
  review: Record<string, ReviewItem>;
  bookmarks: Bookmark[];
  reflections: Record<string, Reflection>;
  discovered: Record<DiscoveryType, Record<string, string>>;
  badges: Partial<Record<BadgeId, string>>;
  dailyAnswered: DayKey[];
}
