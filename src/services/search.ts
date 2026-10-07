import type { Episode, Language, LocalizedText, Person, Place, SeerahEvent, Theme } from '@/models';

export type SearchType = 'episode' | 'event' | 'person' | 'place' | 'theme';

export interface SearchHit {
  type: SearchType;
  id: string;
  score: number;
  /** True when the item was found through a matching person or place rather than its own text. */
  related: boolean;
}

export interface SearchContent {
  episodes: readonly Episode[];
  events: readonly SeerahEvent[];
  people: readonly Person[];
  places: readonly Place[];
  themes: readonly Theme[];
}

/** Lower-case, without diacritics, ʿ/ʾ marks or apostrophes – so "Ka'bah", "Kaaba" and "Kaʿbah" all match "kabah"-like input. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ʿʾ'’`‘]/g, '')
    .replace(/[^a-z0-9؀-ۿ\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const allLanguages = (text: LocalizedText) => [text.en, text.de, text.bs];

interface Entry {
  type: SearchType;
  id: string;
  /** Names/titles in every language (strong match). */
  names: string[];
  /** Descriptive text in the reader's language (weak match). */
  body: string;
}

function entries(content: SearchContent, language: Language): Entry[] {
  const list: Entry[] = [];
  for (const e of content.episodes) {
    list.push({ type: 'episode', id: e.id, names: [...allLanguages(e.title), ...allLanguages(e.subtitle)], body: e.introduction[language] });
  }
  for (const e of content.events) {
    list.push({ type: 'event', id: e.id, names: allLanguages(e.title), body: e.summary.map((b) => b.text[language]).join(' ') });
  }
  for (const p of content.people) {
    list.push({ type: 'person', id: p.id, names: [...allLanguages(p.name), p.arabicName], body: `${p.role[language]} ${p.relationship[language]}` });
  }
  for (const p of content.places) {
    list.push({ type: 'place', id: p.id, names: [...allLanguages(p.name), p.arabicName], body: p.whyItMatters[language] });
  }
  for (const t of content.themes) {
    list.push({ type: 'theme', id: t.id, names: allLanguages(t.name), body: t.description[language] });
  }
  return list.map((entry) => ({ ...entry, names: entry.names.map(normalize), body: normalize(entry.body) }));
}

function scoreEntry(entry: Entry, terms: string[]): number {
  let score = 0;
  for (const term of terms) {
    let best = 0;
    for (const name of entry.names) {
      if (name === term) best = Math.max(best, 10);
      else if (name.split(' ').some((word) => word.startsWith(term))) best = Math.max(best, 6);
      else if (name.includes(term)) best = Math.max(best, 4);
    }
    if (best === 0 && entry.body.includes(term)) best = 1;
    if (best === 0) return 0; // every term must match somewhere
    score += best;
  }
  return score;
}

/**
 * Searches episodes, events, people, places and themes. Person and place hits also bring in their
 * related events and episodes (e.g. "Bilal" → the person, the persecution, the conquest …).
 */
export function search(query: string, language: Language, content: SearchContent, limit = 40): SearchHit[] {
  const terms = normalize(query).split(' ').filter((t) => t.length >= 2);
  if (terms.length === 0) return [];
  const hits = new Map<string, SearchHit>();
  const add = (hit: SearchHit) => {
    const key = `${hit.type}:${hit.id}`;
    const existing = hits.get(key);
    if (!existing || existing.score < hit.score) hits.set(key, hit);
  };

  for (const entry of entries(content, language)) {
    const score = scoreEntry(entry, terms);
    if (score > 0) add({ type: entry.type, id: entry.id, score, related: false });
  }

  for (const hit of [...hits.values()]) {
    if (hit.related || hit.score < 4) continue;
    if (hit.type === 'person') {
      for (const e of content.events) if (e.peopleIds.includes(hit.id)) add({ type: 'event', id: e.id, score: 2, related: true });
      for (const ep of content.episodes) if (ep.people.includes(hit.id)) add({ type: 'episode', id: ep.id, score: 2, related: true });
    }
    if (hit.type === 'place') {
      for (const e of content.events) if (e.placeIds.includes(hit.id)) add({ type: 'event', id: e.id, score: 2, related: true });
      for (const ep of content.episodes) if (ep.places.includes(hit.id)) add({ type: 'episode', id: ep.id, score: 2, related: true });
    }
  }

  return [...hits.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
