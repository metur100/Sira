import type { AppState, Bookmark, BookmarkType, DayKey, DiscoveryType, EpisodeStep, Language, Question } from '@/models';

import { recordMistake, recordSuccess, isDue } from './review';
import { scoreQuiz, type QuizScore } from './quiz';

export const STATE_VERSION = 1;

/** Knowledge points. Every reward is fixed and earned once – no random rewards. */
export const POINTS = {
  correctAnswer: 10,
  reviewCorrect: 5,
  episodeComplete: 50,
  discovery: 2,
  reflection: 5,
  dailyQuestion: 10,
} as const;

export function createInitialState(language: Language = 'en'): AppState {
  return {
    version: STATE_VERSION,
    onboarded: false,
    settings: {
      language,
      themeMode: 'system',
      soundEnabled: true,
      hapticsEnabled: true,
      reminderEnabled: false,
      reminderHour: 18,
      largeText: false,
      highContrast: false,
      reducedMotion: false,
    },
    points: 0,
    episodes: {},
    lastEpisodeId: null,
    quizResults: [],
    correctlyAnswered: [],
    review: {},
    bookmarks: [],
    reflections: {},
    discovered: { event: {}, person: {}, place: {} },
    badges: {},
    dailyAnswered: [],
  };
}

export interface Result {
  state: AppState;
  points: number;
}

export type AnswerMode = 'quiz' | 'review' | 'daily';

/**
 * Records an answer. Points for a correct answer are given once per question; a mistake goes into
 * the review queue, and a correct answer on a due review item moves it forward.
 */
export function applyAnswer(state: AppState, question: Question, correct: boolean, mode: AnswerMode, now: Date): Result {
  const nowIso = now.toISOString();
  const review = { ...state.review };
  const existing = review[question.id];
  let points = 0;
  let correctlyAnswered = state.correctlyAnswered;

  if (!correct) {
    review[question.id] = recordMistake(existing, question.id, question.episodeId, nowIso);
  } else {
    if (!correctlyAnswered.includes(question.id)) {
      correctlyAnswered = [...correctlyAnswered, question.id];
      if (mode !== 'review') points += POINTS.correctAnswer;
    }
    if (existing && isDue(existing, nowIso)) {
      review[question.id] = recordSuccess(existing, nowIso);
      if (mode === 'review') points += POINTS.reviewCorrect;
    }
  }
  return { state: { ...state, review, correctlyAnswered, points: state.points + points }, points };
}

/** Remembers how far the reader got so the journey can be continued. */
export function applyEpisodeStep(state: AppState, episodeId: string, step: EpisodeStep, now: Date): AppState {
  const current = state.episodes[episodeId];
  if (current?.step === step && state.lastEpisodeId === episodeId) return state;
  return {
    ...state,
    lastEpisodeId: episodeId,
    episodes: {
      ...state.episodes,
      [episodeId]: {
        step,
        startedAt: current?.startedAt ?? now.toISOString(),
        completedAt: current?.completedAt ?? null,
        bestScore: current?.bestScore ?? null,
      },
    },
  };
}

export interface EpisodeReward extends Result {
  score: QuizScore;
  firstCompletion: boolean;
}

export function applyEpisodeComplete(state: AppState, episodeId: string, results: readonly boolean[], now: Date): EpisodeReward {
  const score = scoreQuiz(results);
  const current = state.episodes[episodeId];
  const firstCompletion = !current?.completedAt;
  const points = firstCompletion ? POINTS.episodeComplete : 0;
  return {
    score,
    firstCompletion,
    points,
    state: {
      ...state,
      points: state.points + points,
      lastEpisodeId: episodeId,
      episodes: {
        ...state.episodes,
        [episodeId]: {
          step: 'sources',
          startedAt: current?.startedAt ?? now.toISOString(),
          completedAt: current?.completedAt ?? now.toISOString(),
          bestScore: results.length ? Math.max(current?.bestScore ?? 0, score.percent) : (current?.bestScore ?? null),
        },
      },
      // A completion without answered questions (e.g. resumed after the challenge) adds no quiz result.
      quizResults: results.length
        ? [{ episodeId, correct: score.correct, total: score.total, percent: score.percent, date: now.toISOString() }, ...state.quizResults].slice(0, 100)
        : state.quizResults,
    },
  };
}

/** Marks an event, person or place as discovered (first time only). */
export function applyDiscover(state: AppState, type: DiscoveryType, id: string, now: Date): Result {
  if (state.discovered[type][id]) return { state, points: 0 };
  return {
    points: POINTS.discovery,
    state: {
      ...state,
      points: state.points + POINTS.discovery,
      discovered: { ...state.discovered, [type]: { ...state.discovered[type], [id]: now.toISOString() } },
    },
  };
}

export function isBookmarked(bookmarks: readonly Bookmark[], type: BookmarkType, id: string): boolean {
  return bookmarks.some((b) => b.type === type && b.id === id);
}

export function applyToggleBookmark(state: AppState, type: BookmarkType, id: string, now: Date): AppState {
  const bookmarks = isBookmarked(state.bookmarks, type, id)
    ? state.bookmarks.filter((b) => !(b.type === type && b.id === id))
    : [{ type, id, createdAt: now.toISOString() }, ...state.bookmarks];
  return { ...state, bookmarks };
}

/** Saves a personal reflection locally. Reflections are never evaluated. */
export function applyReflection(
  state: AppState,
  input: { questionId: string; episodeId: string; text: string; optionIndex: number | null },
  now: Date,
): Result {
  const text = input.text.trim().slice(0, 2000);
  if (!text && input.optionIndex === null) {
    const reflections = { ...state.reflections };
    delete reflections[input.questionId];
    return { state: { ...state, reflections }, points: 0 };
  }
  const isNew = !state.reflections[input.questionId];
  const points = isNew ? POINTS.reflection : 0;
  return {
    points,
    state: {
      ...state,
      points: state.points + points,
      reflections: {
        ...state.reflections,
        [input.questionId]: { questionId: input.questionId, episodeId: input.episodeId, text, optionIndex: input.optionIndex, updatedAt: now.toISOString() },
      },
    },
  };
}

/** The daily question earns points once per day. */
export function applyDailyAnswered(state: AppState, day: DayKey): Result {
  if (state.dailyAnswered.includes(day)) return { state, points: 0 };
  return {
    points: POINTS.dailyQuestion,
    state: { ...state, points: state.points + POINTS.dailyQuestion, dailyAnswered: [...state.dailyAnswered, day].slice(-400) },
  };
}
