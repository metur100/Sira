import type { DayKey, Question, SeerahEvent } from '@/models';
import { dayNumber } from '@/utils/date';

/**
 * Today's Seerah: one event per calendar day, chosen deterministically so it is the same all day,
 * and walks through the whole timeline before repeating.
 */
export function todaysEvent(day: DayKey, events: readonly SeerahEvent[]): SeerahEvent | null {
  if (events.length === 0) return null;
  const n = dayNumber(day);
  return events[((n % events.length) + events.length) % events.length];
}

/** The daily question: a single multiple-choice or true/false question, different from day to day. */
export function dailyQuestion(day: DayKey, questions: readonly Question[]): Question | null {
  const pool = questions.filter((q) => q.type === 'multipleChoice' || q.type === 'trueFalse');
  if (pool.length === 0) return null;
  const n = dayNumber(day);
  // A step that is coprime with the pool size visits every question before repeating.
  const step = 7;
  return pool[(((n * step) % pool.length) + pool.length) % pool.length];
}
