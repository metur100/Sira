import type { Episode, Person, Place, Question, Route, SeerahEvent, Source, Theme } from '@/models';

import episode01 from './episodes/episode-01.json';
import episode02 from './episodes/episode-02.json';
import episode03 from './episodes/episode-03.json';
import episode04 from './episodes/episode-04.json';
import episode05 from './episodes/episode-05.json';
import episode06 from './episodes/episode-06.json';
import episode07 from './episodes/episode-07.json';
import episode08 from './episodes/episode-08.json';
import episode09 from './episodes/episode-09.json';
import episode10 from './episodes/episode-10.json';
import events from './events/events.json';
import people from './people/people.json';
import places from './places/places.json';
import routes from './places/routes.json';
import questions01 from './questions/episode-01.json';
import questions02 from './questions/episode-02.json';
import questions03 from './questions/episode-03.json';
import questions04 from './questions/episode-04.json';
import questions05 from './questions/episode-05.json';
import questions06 from './questions/episode-06.json';
import questions07 from './questions/episode-07.json';
import questions08 from './questions/episode-08.json';
import questions09 from './questions/episode-09.json';
import questions10 from './questions/episode-10.json';
import sources from './sources/sources.json';
import themes from './themes/themes.json';

/*
 * All religious and historical content lives in JSON files next to this loader, so episodes can be
 * reviewed and replaced without touching application code. To add an episode: add its JSON files
 * and list them below. `validateContent` (run in the test suite) checks every cross-reference.
 */

// JSON imports are widened by TypeScript; the shape is verified by validateContent and the tests.
const cast = <T>(value: unknown) => value as T;

export const EPISODES: readonly Episode[] = cast<Episode[]>([
  episode01, episode02, episode03, episode04, episode05,
  episode06, episode07, episode08, episode09, episode10,
]).sort((a, b) => a.order - b.order);

export const EVENTS: readonly SeerahEvent[] = cast<SeerahEvent[]>(events)
  .slice()
  .sort((a, b) => a.date.sortKey - b.date.sortKey);
export const PEOPLE: readonly Person[] = cast<Person[]>(people);
export const PLACES: readonly Place[] = cast<Place[]>(places);
export const ROUTES: readonly Route[] = cast<Route[]>(routes);
export const SOURCES: readonly Source[] = cast<Source[]>(sources);
export const THEMES: readonly Theme[] = cast<Theme[]>(themes);
export const QUESTIONS: readonly Question[] = cast<Question[][]>([
  questions01, questions02, questions03, questions04, questions05,
  questions06, questions07, questions08, questions09, questions10,
]).flat();

const index = <T extends { id: string }>(items: readonly T[]) => new Map(items.map((item) => [item.id, item] as const));

const episodeMap = index(EPISODES);
const eventMap = index(EVENTS);
const personMap = index(PEOPLE);
const placeMap = index(PLACES);
const routeMap = index(ROUTES);
const sourceMap = index(SOURCES);
const themeMap = index(THEMES);
const questionMap = index(QUESTIONS);

export const getEpisode = (id: string) => episodeMap.get(id);
export const getEvent = (id: string) => eventMap.get(id);
export const getPerson = (id: string) => personMap.get(id);
export const getPlace = (id: string) => placeMap.get(id);
export const getRoute = (id: string) => routeMap.get(id);
export const getSource = (id: string) => sourceMap.get(id);
export const getTheme = (id: string) => themeMap.get(id);
export const getQuestion = (id: string) => questionMap.get(id);

/** Resolves a list of ids, silently skipping unknown ones (validateContent reports them). */
export function resolve<T>(ids: readonly string[], get: (id: string) => T | undefined): T[] {
  return ids.map(get).filter((item): item is T => item !== undefined);
}

/** Checks ids and every cross-reference. Returns a list of problems (empty when the content is valid). */
export function validateContent(): string[] {
  const problems: string[] = [];
  const check = (owner: string, kind: string, ids: readonly string[], map: Map<string, unknown>) => {
    for (const id of ids) if (!map.has(id)) problems.push(`${owner}: unknown ${kind} "${id}"`);
  };
  const unique = (kind: string, items: readonly { id: string }[]) => {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.id)) problems.push(`duplicate ${kind} id "${item.id}"`);
      seen.add(item.id);
    }
  };
  unique('episode', EPISODES);
  unique('event', EVENTS);
  unique('person', PEOPLE);
  unique('place', PLACES);
  unique('route', ROUTES);
  unique('source', SOURCES);
  unique('theme', THEMES);
  unique('question', QUESTIONS);

  for (const ep of EPISODES) {
    const owner = `episode ${ep.id}`;
    check(owner, 'event', [...ep.events, ep.mainEventId], eventMap);
    check(owner, 'person', ep.people, personMap);
    check(owner, 'place', ep.places, placeMap);
    check(owner, 'route', ep.routes, routeMap);
    check(owner, 'question', ep.questions, questionMap);
    check(owner, 'theme', [...ep.themeIds, ...ep.lessons.map((l) => l.themeId)], themeMap);
    check(owner, 'source', [...ep.sources.primary, ...ep.sources.secondary, ...ep.sources.further], sourceMap);
    check(owner, 'source', [...ep.context, ...ep.mainEvent].flatMap((b) => b.sourceIds), sourceMap);
    for (const qid of ep.questions) {
      const q = questionMap.get(qid);
      if (q && q.episodeId !== ep.id) problems.push(`${owner}: question ${qid} belongs to ${q.episodeId}`);
    }
  }
  for (const ev of EVENTS) {
    const owner = `event ${ev.id}`;
    check(owner, 'place', ev.placeIds, placeMap);
    check(owner, 'person', ev.peopleIds, personMap);
    check(owner, 'event', ev.relatedEventIds, eventMap);
    check(owner, 'theme', ev.themeIds, themeMap);
    check(owner, 'source', [...ev.sourceIds, ...ev.summary.flatMap((b) => b.sourceIds)], sourceMap);
    if (ev.episodeId) {
      check(owner, 'episode', [ev.episodeId], episodeMap);
      const ep = episodeMap.get(ev.episodeId);
      if (ep && !ep.events.includes(ev.id)) problems.push(`${owner}: not listed in ${ev.episodeId}`);
    }
  }
  for (const p of PEOPLE) check(`person ${p.id}`, 'source', [...p.sourceIds, ...p.bio.flatMap((b) => b.sourceIds)], sourceMap);
  for (const p of PLACES) check(`place ${p.id}`, 'source', [...p.sourceIds, ...p.description.flatMap((b) => b.sourceIds)], sourceMap);
  for (const r of ROUTES) {
    check(`route ${r.id}`, 'event', [r.eventId], eventMap);
    if (r.points.length < 2) problems.push(`route ${r.id}: needs at least two points`);
  }
  for (const q of QUESTIONS) {
    check(`question ${q.id}`, 'episode', [q.episodeId], episodeMap);
    check(`question ${q.id}`, 'source', q.sourceIds, sourceMap);
    if ((q.type === 'multipleChoice') && !q.options.some((o) => o.id === q.correctOptionId)) {
      problems.push(`question ${q.id}: correct option missing`);
    }
  }
  for (const s of SOURCES) {
    if (s.url && !/^https:\/\/(quran\.com|sunnah\.com)\//.test(s.url)) problems.push(`source ${s.id}: unexpected url host`);
  }
  return problems;
}

// ---------- Relations ----------

export const eventsOfPerson = (personId: string) => EVENTS.filter((e) => e.peopleIds.includes(personId));
export const eventsAtPlace = (placeId: string) => EVENTS.filter((e) => e.placeIds.includes(placeId));
export const episodesOfPerson = (personId: string) => EPISODES.filter((ep) => ep.people.includes(personId));
export const episodesAtPlace = (placeId: string) => EPISODES.filter((ep) => ep.places.includes(placeId));
export const episodesOfTheme = (themeId: string) => EPISODES.filter((ep) => ep.themeIds.includes(themeId));
export const eventsOfTheme = (themeId: string) => EVENTS.filter((e) => e.themeIds.includes(themeId));
export const questionsOfEpisode = (episodeId: string) => resolve(getEpisode(episodeId)?.questions ?? [], getQuestion);
export const peopleAtPlace = (placeId: string) => {
  const ids = new Set(eventsAtPlace(placeId).flatMap((e) => e.peopleIds));
  return PEOPLE.filter((p) => ids.has(p.id));
};
export const routesOfEpisode = (episodeId: string) => resolve(getEpisode(episodeId)?.routes ?? [], getRoute);
