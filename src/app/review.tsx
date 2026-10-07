import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ConnectionCard } from '@/components/content/Cards';
import { QuizCard } from '@/components/quiz/QuizCard';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/Controls';
import { ChapterHeader, EmptyState, HistoricalCard, ProgressBar, Screen, TopBar } from '@/components/ui/Layout';
import { EPISODES, getEpisode, getQuestion } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { LOCALE_TAGS } from '@/localization/i18n';
import type { Question, ReviewItem } from '@/models';
import { dueItems, isDue, reviewCenter } from '@/services/review';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme';

type Tab = 'needs' | 'mastered' | 'recent';
const SESSION_SIZE = 8;
const RECENT_DAYS = 14;

/** Review Center: Needs Review · Mastered · Recently Learned, plus a spaced-review session. */
export default function ReviewScreen() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('needs');
  const [session, setSession] = useState<Question[] | null>(null);

  if (session) return <ReviewSession questions={session} onClose={() => setSession(null)} />;

  return (
    <Screen header={<TopBar title={t('review.title')} />}>
      <ChapterHeader title={t('review.title')} subtitle={t('review.subtitle')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        <FilterChip label={t('review.needs')} selected={tab === 'needs'} onPress={() => setTab('needs')} />
        <FilterChip label={t('review.mastered')} selected={tab === 'mastered'} onPress={() => setTab('mastered')} />
        <FilterChip label={t('review.recent')} selected={tab === 'recent'} onPress={() => setTab('recent')} />
      </ScrollView>
      {tab === 'needs' ? <NeedsReview onStart={setSession} /> : null}
      {tab === 'mastered' ? <Mastered /> : null}
      {tab === 'recent' ? <RecentlyLearned /> : null}
    </Screen>
  );
}

function ItemRow({ item }: { item: ReviewItem }) {
  const { t, l, language } = useI18n();
  const { c } = useTheme();
  const q = getQuestion(item.questionId);
  const ep = getEpisode(item.episodeId);
  const due = isDue(item, new Date().toISOString());
  if (!q) return null;
  return (
    <HistoricalCard accessibilityLabel={`${l(q.prompt)}. ${due ? t('review.dueNow') : ''}`}>
      <AppText variant="tiny" color={c.accent}>
        {ep ? `${t('episode.label', { number: ep.order })} · ${l(ep.title)}` : ''}
      </AppText>
      <AppText variant="bodyBold">{l(q.prompt)}</AppText>
      <View style={styles.meta}>
        <AppText variant="tiny" color={due ? c.interpretation : c.textMuted}>
          {item.mastered
            ? t('review.mastered')
            : due
              ? t('review.dueNow')
              : t('review.nextOn', { date: new Date(item.nextReviewDate).toLocaleDateString(LOCALE_TAGS[language], { day: 'numeric', month: 'short' }) })}
        </AppText>
        <AppText variant="tiny" muted>
          {t('review.missed', { count: item.incorrectCount })}
        </AppText>
      </View>
    </HistoricalCard>
  );
}

function NeedsReview({ onStart }: { onStart: (qs: Question[]) => void }) {
  const { t } = useI18n();
  const review = useAppStore((s) => s.app.review);
  const center = reviewCenter(review, new Date().toISOString());
  const start = () =>
    onStart(
      dueItems(review, new Date().toISOString())
        .slice(0, SESSION_SIZE)
        .map((i) => getQuestion(i.questionId))
        .filter((q): q is Question => q !== undefined),
    );
  if (center.needsReview.length === 0) return <EmptyState icon="check" title={t('review.needs')} body={t('review.emptyNeeds')} />;
  return (
    <View style={styles.list}>
      {center.dueCount > 0 ? (
        <Button label={t('review.start', { count: Math.min(center.dueCount, SESSION_SIZE) })} icon="play" onPress={start} />
      ) : (
        <AppText variant="small" muted>
          {t('review.nothingDue')}
        </AppText>
      )}
      {center.needsReview.map((i) => (
        <ItemRow key={i.questionId} item={i} />
      ))}
    </View>
  );
}

function Mastered() {
  const { t } = useI18n();
  const review = useAppStore((s) => s.app.review);
  const mastered = reviewCenter(review, new Date().toISOString()).mastered;
  if (mastered.length === 0) return <EmptyState icon="star" title={t('review.mastered')} body={t('review.emptyMastered')} />;
  return (
    <View style={styles.list}>
      {mastered.map((i) => (
        <ItemRow key={i.questionId} item={i} />
      ))}
    </View>
  );
}

function RecentlyLearned() {
  const { t } = useI18n();
  const app = useAppStore((s) => s.app);
  const [since] = useState(() => Date.now() - RECENT_DAYS * 86_400_000);
  const recentEpisodes = EPISODES.filter((e) => {
    const done = app.episodes[e.id]?.completedAt;
    return done && new Date(done).getTime() >= since;
  });
  const recentEvents = Object.entries(app.discovered.event)
    .filter(([, at]) => new Date(at).getTime() >= since)
    .sort((a, b) => b[1].localeCompare(a[1]))
    .map(([id]) => id);
  if (recentEpisodes.length === 0 && recentEvents.length === 0) return <EmptyState icon="book" title={t('review.recent')} body={t('review.emptyRecent')} />;
  return (
    <View style={styles.list}>
      {recentEpisodes.length ? (
        <AppText variant="label" muted>
          {t('explore.episodes')}
        </AppText>
      ) : null}
      {recentEpisodes.map((e) => (
        <ConnectionCard key={e.id} type="episode" id={e.id} />
      ))}
      {recentEvents.length ? (
        <AppText variant="label" muted>
          {t('explore.events')}
        </AppText>
      ) : null}
      {recentEvents.map((id) => (
        <ConnectionCard key={id} type="event" id={id} />
      ))}
    </View>
  );
}

function ReviewSession({ questions, onClose }: { questions: Question[]; onClose: () => void }) {
  const { t } = useI18n();
  const recordAnswer = useAppStore((s) => s.recordAnswer);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const done = index >= questions.length;

  return (
    <Screen header={<TopBar title={t('review.title')} backIcon="close" onBack={onClose} />}>
      {done ? (
        <>
          <ChapterHeader title={t('review.doneTitle')} subtitle={t('review.doneBody', { correct: results.filter(Boolean).length, total: results.length })} />
          <Button label={t('common.done')} onPress={onClose} />
          <Button label={t('episode.backHome')} variant="secondary" onPress={() => router.replace('/(tabs)')} />
        </>
      ) : (
        <>
          <ProgressBar progress={index / questions.length} height={5} />
          <QuizCard
            key={questions[index].id}
            question={questions[index]}
            counter={t('quiz.question', { current: index + 1, total: questions.length })}
            showReviewNote={false}
            onResult={(correct) => {
              setResults((r) => [...r, correct]);
              recordAnswer(questions[index], correct, 'review');
            }}
            onContinue={() => setIndex(index + 1)}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { gap: spacing.sm },
  list: { gap: spacing.md },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
});
