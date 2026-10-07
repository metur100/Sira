# Sira – Journey through the life of the Prophet Muhammad ﷺ

**Website:** https://metur100.github.io/Islam.Apps.Landing/en/sira/ · **Privacy policy:** https://metur100.github.io/Islam.Apps.Landing/en/sira/privacy/

An educational app for teenagers and adults that makes learning the Seerah engaging, structured and source-based: explore places, people and events, see how they connect, test your knowledge and reflect.

- Free: no ads, no purchases, no accounts, no tracking
- Fully offline – all content is bundled; nothing is sent anywhere
- Bosnian, German and English
- Light and dark mode, large text, high contrast, reduced motion, screen-reader labels
- Built with Expo (React Native) + TypeScript

## The journey

**EXPLORE → LEARN → CONNECT → THINK → REMEMBER → REFLECT**

Version 1 contains exactly ten key episodes:

1. Birth and early life
2. The beginning of revelation
3. The early call and the first Muslims
4. Persecution in Makkah (incl. Abyssinia, the boycott, the Year of Sorrow and Taʾif)
5. The Hijrah to Madinah
6. Building the community in Madinah
7. The Battle of Badr (and the lesson of Uhud)
8. The Treaty of al-Hudaybiyyah
9. The conquest of Makkah
10. The Farewell Pilgrimage and the final days

Each episode follows: Introduction → Historical context → Timeline → Main event → People involved → Locations (map) → Interactive exploration (connections) → Knowledge challenge → Lessons → Reflection → Sources. Progress is saved per step, so a journey can be continued later.

### Features

- **Timeline** – all 28 events in chronological order, grouped by era, filterable by era or theme. Uncertain dates are labelled *approximate* or *disputed* with an explanation.
- **Map** – Makkah, Madinah, Taʾif, Badr, Uhud, al-Hudaybiyyah and more, with pinch/drag/zoom, decluttered markers and approximate routes. Markers distinguish **historical location**, **approximate location** and **modern geography**; the Red Sea coastline is drawn as a modern, approximate reference.
- **People** – 25 entries with role, relationship, biography and honorifics (ﷺ, رضي الله عنه / عنها, رحمه الله). People are shown only by typography – never by portraits, silhouettes or figures.
- **Connections** – "How is everything connected?": Event → People → Places → Related events, explorable from any node.
- **Quizzes** – multiple choice, true/false, timeline ordering, person→event, place→event and event→lesson matching, sequence ("which came first?") and connection questions, each with an explanation and sources.
- **Reflection** – write a reflection, choose one, or simply continue. Saved locally, never judged.
- **Today's Seerah** and a **daily question** – no notifications required (an optional daily reminder can be enabled).
- **Bookmarks** for episodes, events, people, places and sources; **search** across everything in all three languages.
- **Review Center** – Needs Review / Mastered / Recently Learned with simple spaced review (1, 3, 7, 14 days).
- **Light gamification** – knowledge points earned once per item, explorer badges and completion percentage. No random rewards.

## Religious and historical accuracy

- All content lives in JSON under `src/content/` (`episodes`, `events`, `people`, `places`, `sources`, `themes`, `questions`) – separate from code, reviewable and replaceable without code changes. `validateContent()` checks every cross-reference and runs in the test suite.
- Every statement is labelled **Established fact**, **Historical interpretation** or **Reflection**, and facts carry source references.
- Sources follow a structured model (`id, title, author, type, reference, url, notes`). URLs are only given for stable addresses on quran.com and sunnah.com (Sahih al-Bukhari); everything else is referenced by work and section. No dialogue, quotes, dates or references were invented; where details could not be verified they were left out, and where sources differ the app says so.
- The Prophet ﷺ is never depicted. Illustrations are abstract landscapes, architecture and objects only.

## Audio narration

`src/services/narrationRegistry.ts` defines where recorded narration is registered; `NarrationButton` appears only for episodes with a recording. Version 1 contains no recordings, and narration is never generated automatically.

## Structure

```
src/
  app/          Expo Router: (tabs)/index, timeline, map, explore, profile · episode/[id] · event/[id] · person/[id]
                place/[id] · theme/[id] · source/[id] · connections/[type]/[id] · list/[type] · search · bookmarks
                reflections · review · settings · info/[page] · onboarding (6 steps)
  components/   ui/ (Layout: Screen, TopBar, HistoricalCard, ChapterHeader, ProgressBar … · Controls: SearchBar,
                FilterChip, BottomNavigation …), content/ (Cards: EpisodeCard, EventCard, PersonCard, TimelineItem,
                ConnectionCard · Blocks: SourceCard · HistoricalMap · ReflectionCard · SceneView …), quiz/QuizCard
  content/      JSON content + typed loader and validation
  models/       Episode, SeerahEvent, Person, Place, Route, Source, Question, AppState …
  services/     engine, quiz, review, progress (badges), timeline, search, connections, daily, mapProjection,
                narration, notifications, sound
  storage/      AsyncStorage persistence with migration
  store/        Zustand store with debounced autosave
  theme/        light/dark palettes, high contrast
  localization/ en / de / bs
```

## Scripts

```bash
npm install
npm start               # dev server
npm run android         # development build on device/emulator
npm run verify          # typecheck + lint + tests
npm run generate:icons  # re-render icons (compass rose)
```

Android release build:

```bash
npx expo prebuild --platform android
cd android && ./gradlew bundleRelease assembleRelease
# → android/app/build/outputs/bundle/release/app-release.aab  (Google Play)
# → android/app/build/outputs/apk/release/app-release.apk  (direct install)
```

Release builds are signed with the upload key configured in `~/.gradle/gradle.properties` (see `plugins/withReleaseSigning.js`):

```properties
SIRA_UPLOAD_STORE_FILE=C:/path/to/keystore
SIRA_UPLOAD_STORE_PASSWORD=…
SIRA_UPLOAD_KEY_ALIAS=…
SIRA_UPLOAD_KEY_PASSWORD=…
```

Without these properties the build falls back to the debug key (fine for testing). The keystore and passwords are never committed.

`plugins/withStableAndroidBuild.js` makes local Gradle builds reliable on Windows.

## Privacy

No data leaves the device. Progress, quiz results, bookmarks and reflections are stored locally and can be deleted in Settings → Reset progress.
