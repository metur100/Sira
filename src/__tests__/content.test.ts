import { EPISODES, EVENTS, PEOPLE, PLACES, QUESTIONS, ROUTES, SOURCES, THEMES, validateContent } from '@/content';
import { LANGUAGES, type LocalizedText } from '@/models';

/** Collects every LocalizedText-looking object inside a value. */
function localizedTexts(value: unknown, path = ''): { path: string; text: LocalizedText }[] {
  if (!value || typeof value !== 'object') return [];
  const obj = value as Record<string, unknown>;
  if ('en' in obj && 'de' in obj && 'bs' in obj) return [{ path, text: obj as unknown as LocalizedText }];
  return Object.entries(obj).flatMap(([k, v]) => localizedTexts(v, `${path}.${k}`));
}

describe('content', () => {
  it('passes validation (ids and cross-references)', () => {
    expect(validateContent()).toEqual([]);
  });

  it('has exactly ten episodes in order', () => {
    expect(EPISODES).toHaveLength(10);
    expect(EPISODES.map((e) => e.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('gives every episode the full structure', () => {
    for (const ep of EPISODES) {
      expect(ep.context.length).toBeGreaterThan(0);
      expect(ep.mainEvent.length).toBeGreaterThan(0);
      expect(ep.events).toContain(ep.mainEventId);
      expect(ep.people.length).toBeGreaterThan(0);
      expect(ep.places.length).toBeGreaterThan(0);
      expect(ep.questions.length).toBeGreaterThanOrEqual(5);
      expect(ep.lessons.length).toBeGreaterThan(0);
      expect(ep.reflectionQuestions.length).toBeGreaterThan(0);
      expect(ep.sources.primary.length).toBeGreaterThan(0);
      expect(ep.sources.secondary.length + ep.sources.further.length).toBeGreaterThan(0);
    }
  });

  it('includes the required map locations', () => {
    const ids = PLACES.map((p) => p.id);
    for (const id of ['makkah', 'madinah', 'taif', 'badr', 'uhud', 'hudaybiyyah']) expect(ids).toContain(id);
    for (const p of PLACES) if (p.coords) expect(['historical', 'approximate', 'modern']).toContain(p.precision);
    expect(PLACES.find((p) => p.id === 'hudaybiyyah')?.precision).toBe('approximate');
  });

  it('uses all the required question types', () => {
    const kinds = new Set(QUESTIONS.map((q) => q.kind));
    for (const k of ['general', 'timeline', 'sequence', 'connection', 'personEvent', 'placeEvent', 'eventLesson']) expect(kinds).toContain(k);
    const types = new Set(QUESTIONS.map((q) => q.type));
    for (const t of ['multipleChoice', 'trueFalse', 'ordering', 'matching']) expect(types).toContain(t);
  });

  it('labels every statement and backs facts with sources', () => {
    const blocks = [
      ...EPISODES.flatMap((e) => [...e.context, ...e.mainEvent]),
      ...EVENTS.flatMap((e) => e.summary),
      ...PEOPLE.flatMap((p) => p.bio),
    ];
    for (const b of blocks) {
      expect(['fact', 'interpretation', 'reflection']).toContain(b.kind);
      if (b.kind === 'fact') expect(b.sourceIds.length).toBeGreaterThan(0);
    }
  });

  it('marks uncertain dates and explains disputed ones', () => {
    for (const e of EVENTS) {
      if (e.date.certainty === 'disputed') expect(e.date.note).not.toBeNull();
    }
    expect(EVENTS.find((e) => e.id === 'isra-miraj')?.date.certainty).toBe('disputed');
    expect(EVENTS.find((e) => e.id === 'hijrah')?.date.certainty).toBe('established');
  });

  it('only links to known reference sites', () => {
    for (const s of SOURCES) {
      if (s.url) expect(s.url).toMatch(/^https:\/\/(quran\.com|sunnah\.com)\//);
      if (s.type !== 'quran' && s.type !== 'hadith') expect(s.url).toBeNull();
    }
  });

  it('uses the honorific ﷺ only for the Prophet and gives companions an honorific', () => {
    for (const p of PEOPLE) {
      if (p.honorific === 'saw') expect(p.id).toBe('muhammad');
      if (['abu-bakr', 'umar', 'uthman', 'ali', 'bilal'].includes(p.id)) expect(p.honorific).toBe('ra');
      if (['khadijah', 'aishah'].includes(p.id)) expect(p.honorific).toBe('raha');
    }
  });

  it('is fully translated', () => {
    for (const item of [...EPISODES, ...EVENTS, ...PEOPLE, ...PLACES, ...ROUTES, ...THEMES, ...QUESTIONS, ...SOURCES]) {
      for (const { path, text } of localizedTexts(item)) {
        for (const lang of LANGUAGES) {
          expect({ id: (item as { id: string }).id, path, lang, ok: text[lang].trim().length > 0 }).toEqual({
            id: (item as { id: string }).id,
            path,
            lang,
            ok: true,
          });
        }
      }
    }
  });
});
