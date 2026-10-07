import type { Era, SeerahEvent } from '@/models';

export function sortChronologically(events: readonly SeerahEvent[]): SeerahEvent[] {
  return [...events].sort((a, b) => a.date.sortKey - b.date.sortKey);
}

/** True when the ids are in chronological order (used by timeline challenges and tests). */
export function isChronological(ids: readonly string[], events: readonly SeerahEvent[]): boolean {
  const keys = ids.map((id) => events.find((e) => e.id === id)?.date.sortKey);
  if (keys.some((k) => k === undefined)) return false;
  return keys.every((k, i) => i === 0 || (keys[i - 1] as number) <= (k as number));
}

export const ERA_ORDER: readonly Era[] = ['before', 'makkah', 'madinah'];

export interface TimelineSection {
  era: Era;
  events: SeerahEvent[];
}

/** Groups events by era (before prophethood, Makkah, Madinah) in chronological order. */
export function timelineSections(events: readonly SeerahEvent[], filter?: (e: SeerahEvent) => boolean): TimelineSection[] {
  const sorted = sortChronologically(filter ? events.filter(filter) : events);
  return ERA_ORDER.map((era) => ({ era, events: sorted.filter((e) => e.era === era) })).filter((s) => s.events.length > 0);
}
