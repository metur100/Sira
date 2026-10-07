import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BlockView, SourceSections } from '@/components/content/Blocks';
import { EventCard, PersonCard, PlaceCard, TimelineItem } from '@/components/content/Cards';
import { ConnectionView } from '@/components/content/ConnectionView';
import { HistoricalMap } from '@/components/content/HistoricalMap';
import { NarrationButton } from '@/components/content/NarrationButton';
import { ReflectionCard } from '@/components/content/ReflectionCard';
import { SceneView } from '@/components/content/SceneView';
import { QuizCard } from '@/components/quiz/QuizCard';
import { AppText } from '@/components/ui/AppText';
import { Button, IconButton } from '@/components/ui/Button';
import { BookmarkButton, FilterChip } from '@/components/ui/Controls';
import { Icon } from '@/components/ui/Icon';
import { ChapterHeader, EmptyState, HistoricalCard, ProgressBar } from '@/components/ui/Layout';
import {
  EPISODES,
  EVENTS,
  getEpisode,
  getEvent,
  getPerson,
  getPlace,
  getQuestion,
  getRoute,
  getTheme,
  PEOPLE,
  PLACES,
  resolve,
  THEMES,
} from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useStatusBar } from '@/hooks/useStatusBar';
import { useTheme } from '@/hooks/useTheme';
import { openConnections, openNode } from '@/lib/navigation';
import type { Episode, EpisodeStep } from '@/models';
import { connectionChain } from '@/services/connections';
import { sortChronologically } from '@/services/timeline';
import { type EpisodeOutcome, useAppStore } from '@/store/appStore';
import { radius, spacing } from '@/theme';

export const EPISODE_STEPS: readonly EpisodeStep[] = [
  'introduction',
  'context',
  'timeline',
  'mainEvent',
  'people',
  'locations',
  'explore',
  'challenge',
  'lesson',
  'reflection',
  'sources',
];
const CHALLENGE_INDEX = EPISODE_STEPS.indexOf('challenge');

export default function EpisodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const episode = getEpisode(String(id));
  const { t } = useI18n();
  useStatusBar();
  if (!episode) {
    return (
      <SafeAreaView style={styles.fill}>
        <EmptyState icon="book" title={t('episode.notFound')} actionLabel={t('common.back')} onAction={() => router.back()} />
      </SafeAreaView>
    );
  }
  // Keyed so that "next episode" always starts with fresh state.
  return <EpisodeJourney key={episode.id} episode={episode} />;
}

function EpisodeJourney({ episode }: { episode: Episode }) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const setEpisodeStep = useAppStore((s) => s.setEpisodeStep);
  const discover = useAppStore((s) => s.discover);
  const recordAnswer = useAppStore((s) => s.recordAnswer);
  const completeEpisode = useAppStore((s) => s.completeEpisode);
  const setPaused = useAppStore((s) => s.setCelebrationsPaused);

  // Resume where the reader stopped; after the challenge, resume at the challenge so the quiz is not skipped.
  const [stepIndex, setStepIndex] = useState(() => {
    const progress = useAppStore.getState().app.episodes[episode.id];
    if (!progress || progress.completedAt) return 0;
    const saved = EPISODE_STEPS.indexOf(progress.step);
    return saved > CHALLENGE_INDEX ? CHALLENGE_INDEX : Math.max(0, saved);
  });
  const [quizIndex, setQuizIndex] = useState(-1);
  const [results, setResults] = useState<boolean[]>([]);
  const [quizPoints, setQuizPoints] = useState(0);
  const [outcome, setOutcome] = useState<EpisodeOutcome | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  const step = EPISODE_STEPS[stepIndex];
  const questions = resolve(episode.questions, getQuestion);
  const challengeDone = quizIndex >= questions.length;

  useEffect(() => {
    setPaused(true);
    return () => setPaused(false);
  }, [setPaused]);

  useEffect(() => {
    if (outcome) setPaused(false);
  }, [outcome, setPaused]);

  // Remember the step and record discoveries as the reader reaches them.
  useEffect(() => {
    setEpisodeStep(episode.id, step);
    if (step === 'timeline') discover('event', episode.events);
    if (step === 'people') discover('person', episode.people);
    if (step === 'locations') discover('place', episode.places);
  }, [episode, step, setEpisodeStep, discover]);

  const go = (index: number) => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setStepIndex(index);
  };

  const finish = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setOutcome(completeEpisode(episode.id, results, quizPoints));
  };

  if (outcome) return <EpisodeDone episode={episode} outcome={outcome} />;

  const stepName = t(`episode.step.${step}`);
  const isLast = stepIndex === EPISODE_STEPS.length - 1;
  const canContinue = step !== 'challenge' || challengeDone;

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: c.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <IconButton icon="close" label={t('common.close')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />
        <View style={styles.headerText}>
          <AppText variant="tiny" muted numberOfLines={1}>
            {t('episode.label', { number: episode.order })} · {l(episode.title)}
          </AppText>
          <AppText variant="subheading" numberOfLines={1} accessibilityLabel={t('a11y.step', { current: stepIndex + 1, total: EPISODE_STEPS.length, name: stepName })}>
            {stepName}
          </AppText>
        </View>
        <BookmarkButton type="episode" id={episode.id} />
      </View>
      <View style={styles.progress}>
        <View style={styles.flex}>
          <ProgressBar progress={(stepIndex + 1) / EPISODE_STEPS.length} height={5} />
        </View>
        <AppText variant="tiny" muted>
          {t('episode.stepOf', { current: stepIndex + 1, total: EPISODE_STEPS.length })}
        </AppText>
      </View>

      <ScrollView ref={scrollRef} scrollEnabled={scrollEnabled} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'introduction' ? (
          <>
            <View style={styles.scene}>
              <SceneView scene={episode.scene} height={190} />
            </View>
            <ChapterHeader label={`${t('episode.label', { number: episode.order })} · ${l(episode.period)}`} title={l(episode.title)} subtitle={l(episode.subtitle)} />
            <NarrationButton episodeId={episode.id} />
            <AppText variant="heading" style={styles.intro}>
              {l(episode.introduction)}
            </AppText>
            <View style={styles.chips}>
              {resolve(episode.themeIds, getTheme).map((th) => (
                <FilterChip key={th.id} icon="tag" label={l(th.name)} selected={false} onPress={() => openNode('theme', th.id)} />
              ))}
            </View>
            <HistoricalCard tone="alt">
              <AppText variant="label" muted>
                {t('episode.overview')}
              </AppText>
              {EPISODE_STEPS.map((s, i) => (
                <AppText key={s} variant="small" muted={i !== 0}>
                  {i + 1}. {t(`episode.step.${s}`)}
                </AppText>
              ))}
            </HistoricalCard>
          </>
        ) : null}

        {step === 'context' ? (
          <>
            <ChapterHeader title={stepName} />
            {episode.context.map((b, i) => (
              <BlockView key={i} block={b} />
            ))}
          </>
        ) : null}

        {step === 'timeline' ? (
          <>
            <ChapterHeader title={stepName} subtitle={l(episode.period)} />
            {sortChronologically(resolve(episode.events, getEvent)).map((e, i, all) => (
              <TimelineItem key={e.id} event={e} first={i === 0} last={i === all.length - 1} />
            ))}
          </>
        ) : null}

        {step === 'mainEvent' ? (
          <>
            <ChapterHeader title={stepName} />
            {episode.mainEvent.map((b, i) => (
              <BlockView key={i} block={b} />
            ))}
            {getEvent(episode.mainEventId) ? <EventCard event={getEvent(episode.mainEventId)!} compact /> : null}
          </>
        ) : null}

        {step === 'people' ? (
          <>
            <ChapterHeader title={stepName} subtitle={t('episode.tapToDiscover')} />
            {resolve(episode.people, getPerson).map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </>
        ) : null}

        {step === 'locations' ? (
          <>
            <ChapterHeader title={stepName} subtitle={t('episode.mapHint')} />
            <HistoricalMap
              places={resolve(episode.places, getPlace)}
              routes={resolve(episode.routes, getRoute)}
              height={320}
              fitToPlaces
              onSelect={(pid) => openNode('place', pid)}
              onInteraction={(active) => setScrollEnabled(!active)}
            />
            {resolve(episode.routes, getRoute).map((r) => (
              <View key={r.id} style={[styles.routeNote, { borderColor: c.accent }]}>
                <AppText variant="bodyBold">{l(r.name)}</AppText>
                <AppText variant="small" muted>
                  {t('map.route')}: {l(r.note)}
                </AppText>
              </View>
            ))}
            {resolve(episode.places, getPlace).map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </>
        ) : null}

        {step === 'explore' ? (
          <>
            <ChapterHeader title={t('connections.title')} subtitle={t('connections.subtitle')} />
            <AppText variant="small" muted>
              {t('connections.chain')}
            </AppText>
            <ConnectionView
              groups={connectionChain(episode.mainEventId, { episodes: EPISODES, events: EVENTS, people: PEOPLE, places: PLACES, themes: THEMES })}
              titles={[t('episode.mainEvent'), t('explore.people'), t('explore.places'), t('event.related')]}
              onNodePress={(type, nid) => openConnections(type, nid)}
            />
          </>
        ) : null}

        {step === 'challenge' ? (
          quizIndex < 0 ? (
            <>
              <ChapterHeader title={stepName} subtitle={t('episode.challengeIntro', { count: questions.length })} />
              <Button label={t('episode.challengeStart')} icon="play" onPress={() => setQuizIndex(0)} />
            </>
          ) : challengeDone ? (
            <>
              <ChapterHeader title={stepName} />
              <HistoricalCard tone="gold">
                <AppText variant="title" align="center">
                  {t('episode.challengeResult', { correct: results.filter(Boolean).length, total: results.length })}
                </AppText>
                {results.some((r) => !r) ? (
                  <AppText variant="small" muted align="center">
                    {t('episode.challengeRetry')}
                  </AppText>
                ) : null}
              </HistoricalCard>
            </>
          ) : (
            <QuizCard
              key={questions[quizIndex].id}
              question={questions[quizIndex]}
              counter={t('quiz.question', { current: quizIndex + 1, total: questions.length })}
              onResult={(correct) => {
                setResults((r) => [...r, correct]);
                setQuizPoints((p) => p + recordAnswer(questions[quizIndex], correct, 'quiz'));
              }}
              onContinue={() => {
                scrollRef.current?.scrollTo({ y: 0, animated: false });
                setQuizIndex(quizIndex + 1);
              }}
            />
          )
        ) : null}

        {step === 'lesson' ? (
          <>
            <ChapterHeader title={stepName} />
            {episode.lessons.map((lesson, i) => (
              <HistoricalCard key={i}>
                <View style={styles.row}>
                  <Icon name="sparkle" size={18} color={c.reflection} />
                  <AppText variant="heading" style={styles.flex}>
                    {l(lesson.title)}
                  </AppText>
                </View>
                <AppText variant="body">{l(lesson.text)}</AppText>
                {getTheme(lesson.themeId) ? (
                  <View style={styles.chips}>
                    <FilterChip icon="tag" label={l(getTheme(lesson.themeId)?.name)} selected={false} onPress={() => openNode('theme', lesson.themeId)} />
                  </View>
                ) : null}
              </HistoricalCard>
            ))}
          </>
        ) : null}

        {step === 'reflection' ? (
          <>
            <ChapterHeader title={t('reflection.title')} subtitle={t('reflection.note')} />
            {episode.reflectionQuestions.map((q) => (
              <ReflectionCard key={q.id} question={q} episodeId={episode.id} />
            ))}
          </>
        ) : null}

        {step === 'sources' ? (
          <>
            <ChapterHeader title={stepName} />
            <SourceSections sources={episode.sources} />
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
        {stepIndex > 0 ? <IconButton icon="back" label={t('common.back')} onPress={() => go(stepIndex - 1)} /> : null}
        <Button
          label={isLast ? t('episode.finish') : step === 'reflection' ? `${t('reflection.skip')}` : t('episode.next')}
          iconRight={isLast ? 'check' : 'chevron'}
          disabled={!canContinue}
          onPress={() => (isLast ? finish() : go(stepIndex + 1))}
          style={styles.flex}
        />
      </View>
    </SafeAreaView>
  );
}

function EpisodeDone({ episode, outcome }: { episode: Episode; outcome: EpisodeOutcome }) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const next = EPISODES.find((e) => e.order === episode.order + 1);
  const points = outcome.points + outcome.quizPoints;
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.scene}>
          <SceneView scene={episode.scene} height={160} />
        </View>
        <ChapterHeader label={t('episode.completed')} title={t('episode.doneTitle')} subtitle={t('episode.doneBody', { title: l(episode.title) })} />
        {outcome.score.total > 0 ? (
          <HistoricalCard tone="gold">
            <AppText variant="title" align="center">
              {t('episode.challengeResult', { correct: outcome.score.correct, total: outcome.score.total })}
            </AppText>
          </HistoricalCard>
        ) : null}
        {points > 0 ? (
          <View style={[styles.points, { backgroundColor: c.goldSoft }]}>
            <Icon name="star" size={20} color={c.accent} />
            <AppText variant="bodyBold" color={c.accent}>
              {t('episode.points', { points })}
            </AppText>
          </View>
        ) : null}
        {next ? (
          <Button label={`${t('episode.nextEpisode')}: ${l(next.title)}`} iconRight="chevron" onPress={() => router.replace({ pathname: '/episode/[id]', params: { id: next.id } })} />
        ) : null}
        <Button label={t('episode.backHome')} variant="secondary" onPress={() => router.replace('/(tabs)')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xs, minHeight: 56 },
  headerText: { flex: 1, alignItems: 'center' },
  progress: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.lg },
  scene: { borderRadius: radius.lg, overflow: 'hidden' },
  intro: { fontStyle: 'italic' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  routeNote: { borderLeftWidth: 3, paddingLeft: spacing.md, gap: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  points: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, padding: spacing.md },
});
