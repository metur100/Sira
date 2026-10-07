import { EPISODES, EVENTS, getQuestion, PEOPLE, PLACES, QUESTIONS, THEMES } from '@/content';
import type { Question } from '@/models';
import { connectionChain, connectionsOf } from '@/services/connections';
import { dailyQuestion, todaysEvent } from '@/services/daily';
import { applyAnswer, applyEpisodeComplete, createInitialState } from '@/services/engine';
import { distanceKm, project } from '@/services/mapProjection';
import { narrationFor } from '@/services/narrationRegistry';
import { evaluateAnswer, scoreQuiz } from '@/services/quiz';
import { normalize, search } from '@/services/search';
import { isChronological, sortChronologically, timelineSections } from '@/services/timeline';

const NOW = new Date('2026-10-07T10:00:00.000Z');
const content = { episodes: EPISODES, events: EVENTS, people: PEOPLE, places: PLACES, themes: THEMES };

describe('timeline', () => {
  it('orders the key events chronologically', () => {
    expect(isChronological(['birth', 'first-revelation', 'public-call', 'hijrah', 'badr', 'hudaybiyyah', 'conquest', 'farewell'], EVENTS)).toBe(true);
    expect(isChronological(['hudaybiyyah', 'hijrah', 'badr'], EVENTS)).toBe(false);
    expect(isChronological(['unknown'], EVENTS)).toBe(false);
  });

  it('sorts and groups by era', () => {
    const sorted = sortChronologically(EVENTS);
    expect(sorted[0].id).toBe('elephant');
    expect(sorted[sorted.length - 1].id).toBe('death');
    const sections = timelineSections(EVENTS);
    expect(sections.map((s) => s.era)).toEqual(['before', 'makkah', 'madinah']);
    expect(sections.flatMap((s) => s.events)).toHaveLength(EVENTS.length);
  });

  it('keeps every ordering question consistent with the timeline where events exist', () => {
    // "Which came first?" questions must point to the earliest option.
    const q = getQuestion('e05-q5') as Extract<Question, { type: 'multipleChoice' }>;
    expect(q.correctOptionId).toBe('b');
    expect(isChronological(['hijrah', 'badr', 'hudaybiyyah'], EVENTS)).toBe(true);
  });
});

describe('quiz', () => {
  it('evaluates all question types', () => {
    const mc = getQuestion('e01-q1')!;
    expect(evaluateAnswer(mc, { type: 'option', optionId: 'a' })).toBe(true);
    expect(evaluateAnswer(mc, { type: 'option', optionId: 'b' })).toBe(false);
    const tf = getQuestion('e03-q2')!;
    expect(evaluateAnswer(tf, { type: 'boolean', value: false })).toBe(true);
    const order = getQuestion('e05-q3') as Extract<Question, { type: 'ordering' }>;
    expect(evaluateAnswer(order, { type: 'order', ids: order.items.map((i) => i.id) })).toBe(true);
    expect(evaluateAnswer(order, { type: 'order', ids: [...order.items.map((i) => i.id)].reverse() })).toBe(false);
    const match = getQuestion('e01-q4')!;
    expect(evaluateAnswer(match, { type: 'pairs', mistakes: 1 })).toBe(true);
    expect(evaluateAnswer(match, { type: 'pairs', mistakes: 2 })).toBe(false);
  });

  it('scores quizzes', () => {
    expect(scoreQuiz([true, true, false, true])).toEqual({ correct: 3, total: 4, percent: 75 });
    expect(scoreQuiz([])).toEqual({ correct: 0, total: 0, percent: 0 });
  });

  it('gives points once per question and stores mistakes for review', () => {
    const q = QUESTIONS[0];
    const first = applyAnswer(createInitialState(), q, true, 'quiz', NOW);
    expect(first.points).toBe(10);
    expect(applyAnswer(first.state, q, true, 'quiz', NOW).points).toBe(0);
    const wrong = applyAnswer(createInitialState(), q, false, 'quiz', NOW);
    expect(wrong.state.review[q.id]).toMatchObject({ episodeId: q.episodeId, incorrectCount: 1 });
  });
});

describe('episode completion', () => {
  it('records completion, best score and quiz results', () => {
    const r1 = applyEpisodeComplete(createInitialState(), 'episode-01', [true, false, true, true], NOW);
    expect(r1.firstCompletion).toBe(true);
    expect(r1.points).toBe(50);
    expect(r1.state.episodes['episode-01']).toMatchObject({ bestScore: 75 });
    expect(r1.state.quizResults[0]).toMatchObject({ episodeId: 'episode-01', percent: 75 });
    const r2 = applyEpisodeComplete(r1.state, 'episode-01', [true, true, true, true], NOW);
    expect(r2.firstCompletion).toBe(false);
    expect(r2.points).toBe(0);
    expect(r2.state.episodes['episode-01'].bestScore).toBe(100);
    expect(r2.state.quizResults).toHaveLength(2);
    const r3 = applyEpisodeComplete(r2.state, 'episode-01', [], NOW);
    expect(r3.state.quizResults).toHaveLength(2);
    expect(r3.state.episodes['episode-01'].bestScore).toBe(100);
  });
});

describe('search', () => {
  it('normalises diacritics and Arabic transliteration marks', () => {
    expect(normalize('Kaʿbah')).toBe(normalize('Kabah'));
    expect(normalize('Ḥudaybiyyah')).toBe('hudaybiyyah');
    expect(normalize('Hidžra')).toBe('hidzra');
  });

  it('finds Bilal with his related events and episodes', () => {
    const hits = search('Bilal', 'en', content);
    expect(hits[0]).toMatchObject({ type: 'person', id: 'bilal', related: false });
    expect(hits.some((h) => h.type === 'event' && h.id === 'persecution')).toBe(true);
    expect(hits.some((h) => h.type === 'episode' && h.id === 'episode-04')).toBe(true);
  });

  it('matches names in every language', () => {
    expect(search('Hidschra', 'en', content).some((h) => h.id === 'hijrah')).toBe(true);
    expect(search('Bedr', 'de', content).some((h) => h.id === 'badr')).toBe(true);
    expect(search('x', 'en', content)).toEqual([]);
    expect(search('zzzzqq', 'en', content)).toEqual([]);
  });
});

describe('connections', () => {
  it('connects the Hijrah to its people, places and episode', () => {
    const groups = connectionsOf({ type: 'event', id: 'hijrah' }, content);
    const ids = (type: string) => groups.find((g) => g.type === type)?.nodes.map((n) => n.id) ?? [];
    expect(ids('person')).toEqual(expect.arrayContaining(['muhammad', 'abu-bakr', 'ansar', 'muhajirun']));
    expect(ids('place')).toEqual(expect.arrayContaining(['makkah', 'madinah']));
    expect(ids('episode')).toEqual(['episode-05']);
  });

  it('builds the event → people → places → related chain', () => {
    const chain = connectionChain('badr', content);
    expect(chain[0].nodes[0].id).toBe('badr');
    expect(chain.map((g) => g.type)).toEqual(['event', 'person', 'place', 'event']);
  });

  it('never lists a node as connected to itself', () => {
    for (const p of PEOPLE) {
      const groups = connectionsOf({ type: 'person', id: p.id }, content);
      expect(groups.flatMap((g) => g.nodes).some((n) => n.type === 'person' && n.id === p.id)).toBe(false);
    }
  });
});

describe('daily', () => {
  it("is stable for a day and changes between days", () => {
    expect(todaysEvent('2026-10-07', EVENTS)?.id).toBe(todaysEvent('2026-10-07', EVENTS)?.id);
    const ids = new Set(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].map((d) => todaysEvent(d, EVENTS)?.id));
    expect(ids.size).toBe(4);
    const q = dailyQuestion('2026-10-07', QUESTIONS);
    expect(q && ['multipleChoice', 'trueFalse'].includes(q.type)).toBe(true);
  });
});

describe('map', () => {
  it('projects places inside the canvas and measures distances', () => {
    for (const p of PLACES) {
      if (!p.coords) continue;
      const { x, y } = project(p.coords, 1000, 1000);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1000);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1000);
    }
    const makkah = PLACES.find((p) => p.id === 'makkah')!.coords!;
    const madinah = PLACES.find((p) => p.id === 'madinah')!.coords!;
    const km = distanceKm(makkah, madinah);
    expect(km).toBeGreaterThan(330);
    expect(km).toBeLessThan(360);
  });
});

describe('narration', () => {
  it('has no automatic narration and resolves registered recordings only', () => {
    expect(narrationFor('episode-01', 'en')).toBeNull();
    expect(narrationFor('episode-01', 'en', { 'episode-01': { en: 42 } })).toBe(42);
    expect(narrationFor('episode-01', 'de', { 'episode-01': { en: 42 } })).toBeNull();
  });
});
