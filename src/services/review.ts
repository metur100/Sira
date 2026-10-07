import type { ReviewItem } from '@/models';

/**
 * Simple spaced review (Leitner boxes). A missed question starts in box 0 (due now);
 * each correct review moves it up, with growing intervals, until it is mastered.
 */
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 14] as const;
export const MAX_BOX = REVIEW_INTERVAL_DAYS.length - 1;

const DAY_MS = 86_400_000;

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();
}

export function recordMistake(existing: ReviewItem | undefined, questionId: string, episodeId: string, nowIso: string): ReviewItem {
  return {
    questionId,
    episodeId,
    box: 0,
    correctCount: existing?.correctCount ?? 0,
    incorrectCount: (existing?.incorrectCount ?? 0) + 1,
    lastSeen: nowIso,
    nextReviewDate: nowIso,
    mastered: false,
  };
}

export function recordSuccess(item: ReviewItem, nowIso: string): ReviewItem {
  const box = item.box + 1;
  if (box > MAX_BOX) {
    return { ...item, box: MAX_BOX, correctCount: item.correctCount + 1, lastSeen: nowIso, mastered: true };
  }
  return {
    ...item,
    box,
    correctCount: item.correctCount + 1,
    lastSeen: nowIso,
    nextReviewDate: addDays(nowIso, REVIEW_INTERVAL_DAYS[box]),
  };
}

export function isDue(item: ReviewItem, nowIso: string): boolean {
  return !item.mastered && new Date(item.nextReviewDate).getTime() <= new Date(nowIso).getTime();
}

/** Due items, most-missed first. */
export function dueItems(items: Record<string, ReviewItem>, nowIso: string): ReviewItem[] {
  return Object.values(items)
    .filter((item) => isDue(item, nowIso))
    .sort((a, b) => b.incorrectCount - a.incorrectCount || a.nextReviewDate.localeCompare(b.nextReviewDate));
}

export function nextReviewDate(items: Record<string, ReviewItem>): string | null {
  const pending = Object.values(items).filter((i) => !i.mastered).map((i) => i.nextReviewDate);
  return pending.length ? pending.sort()[0] : null;
}

export interface ReviewCenter {
  /** Missed questions not yet mastered (due ones first). */
  needsReview: ReviewItem[];
  mastered: ReviewItem[];
  dueCount: number;
}

export function reviewCenter(items: Record<string, ReviewItem>, nowIso: string): ReviewCenter {
  const all = Object.values(items);
  const due = dueItems(items, nowIso);
  const waiting = all
    .filter((i) => !i.mastered && !isDue(i, nowIso))
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate));
  return {
    needsReview: [...due, ...waiting],
    mastered: all.filter((i) => i.mastered).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)),
    dueCount: due.length,
  };
}
