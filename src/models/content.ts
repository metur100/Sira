import type { LocalizedText } from './common';

// ---------- Sources ----------

export type SourceType = 'quran' | 'hadith' | 'seerah' | 'history' | 'biography';

/**
 * A verifiable reference. `url` is only set for stable, well-known addresses
 * (e.g. quran.com, sunnah.com); it is never guessed.
 */
export interface Source {
  id: string;
  title: string;
  author: string | null;
  type: SourceType;
  reference: string;
  url: string | null;
  notes: LocalizedText | null;
}

// ---------- Text blocks ----------

/**
 * Every statement is labelled so the reader always knows what kind of claim it is:
 * - fact: established by the Quran, authentic hadith or broad agreement of the Seerah sources
 * - interpretation: a historical reading, an approximate date or a point where sources differ
 * - reflection: a lesson or thought for the reader, not a historical claim
 */
export type BlockKind = 'fact' | 'interpretation' | 'reflection';

export interface ContentBlock {
  kind: BlockKind;
  text: LocalizedText;
  sourceIds: string[];
}

// ---------- People ----------

/**
 * saw: ﷺ (the Prophet) · ra / raha: رضي الله عنه / عنها (companions) ·
 * rh: رحمه الله · none: no honorific
 */
export type Honorific = 'saw' | 'ra' | 'raha' | 'rh' | 'none';

export type PersonKind = 'prophet' | 'family' | 'companion' | 'quraysh' | 'other' | 'group';

export interface Person {
  id: string;
  name: LocalizedText;
  arabicName: string;
  honorific: Honorific;
  kind: PersonKind;
  role: LocalizedText;
  relationship: LocalizedText;
  bio: ContentBlock[];
  sourceIds: string[];
}

// ---------- Places & routes ----------

/**
 * historical: the site is securely identified ·
 * approximate: the exact spot is uncertain ·
 * modern: a present-day reference shown only for orientation
 */
export type Precision = 'historical' | 'approximate' | 'modern';

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Place {
  id: string;
  name: LocalizedText;
  arabicName: string;
  kind: 'city' | 'mountain' | 'cave' | 'battlefield' | 'site' | 'region';
  precision: Precision;
  /** Omitted when the place lies outside the map (e.g. Abyssinia). */
  coords: Coordinates | null;
  whyItMatters: LocalizedText;
  description: ContentBlock[];
  /** Explains how the location is known or why it is approximate. */
  locationNote: LocalizedText;
  sourceIds: string[];
}

export interface Route {
  id: string;
  name: LocalizedText;
  eventId: string;
  points: Coordinates[];
  /** Routes are always drawn as approximate; the note says what is known. */
  note: LocalizedText;
}

// ---------- Events ----------

export type Era = 'before' | 'makkah' | 'madinah';

export interface EventDate {
  /** Used for chronological ordering only. */
  sortKey: number;
  /** As displayed, e.g. "c. 570 CE" or "2 AH / 624 CE". */
  label: LocalizedText;
  certainty: 'established' | 'approximate' | 'disputed';
  note: LocalizedText | null;
}

export interface SeerahEvent {
  id: string;
  title: LocalizedText;
  date: EventDate;
  era: Era;
  summary: ContentBlock[];
  placeIds: string[];
  peopleIds: string[];
  episodeId: string | null;
  relatedEventIds: string[];
  themeIds: string[];
  sourceIds: string[];
}

// ---------- Themes ----------

export interface Theme {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
}

// ---------- Episodes ----------

export interface Scene {
  sky: 'night' | 'dawn' | 'day' | 'dusk';
  elements: SceneElement[];
}

export type SceneElement =
  | 'stars'
  | 'crescent'
  | 'mountains'
  | 'dunes'
  | 'city'
  | 'kaaba'
  | 'mosque'
  | 'cave'
  | 'palms'
  | 'caravan'
  | 'tents'
  | 'lamp'
  | 'scroll'
  | 'sea';

export interface Lesson {
  title: LocalizedText;
  text: LocalizedText;
  themeId: string;
}

export interface ReflectionQuestion {
  id: string;
  prompt: LocalizedText;
  /** Ready-made reflections the reader can choose instead of writing. */
  options: LocalizedText[];
}

export interface EpisodeSources {
  primary: string[];
  secondary: string[];
  further: string[];
}

export interface Episode {
  id: string;
  order: number;
  era: Era;
  title: LocalizedText;
  subtitle: LocalizedText;
  period: LocalizedText;
  scene: Scene;
  introduction: LocalizedText;
  context: ContentBlock[];
  mainEvent: ContentBlock[];
  /** The event at the centre of the episode (used for the connection view). */
  mainEventId: string;
  events: string[];
  people: string[];
  places: string[];
  routes: string[];
  questions: string[];
  lessons: Lesson[];
  reflectionQuestions: ReflectionQuestion[];
  sources: EpisodeSources;
  themeIds: string[];
}
