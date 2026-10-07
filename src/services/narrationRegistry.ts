import type { Language } from '@/models';

/**
 * Audio narration registry.
 *
 * Version 1 ships without narration. Narration must be recorded by a qualified human reader and
 * reviewed – it is never generated automatically. To add a recording, place the file in
 * assets/narration/ and register it below, e.g.:
 *
 *   'episode-05': { en: require('../../assets/narration/episode-05-en.mp3') },
 *
 * The episode screen shows a play button only for episodes that have a recording.
 */
export type NarrationRegistry = Partial<Record<string, Partial<Record<Language, number>>>>;

export const NARRATION: NarrationRegistry = {};

export function narrationFor(episodeId: string, language: Language, registry: NarrationRegistry = NARRATION): number | null {
  return registry[episodeId]?.[language] ?? null;
}
