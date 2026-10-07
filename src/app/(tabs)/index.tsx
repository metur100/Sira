import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { EpisodeCard, EventCard } from '@/components/content/Cards';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FilterChip, HeroHeader, SearchBar, StatusBarBackdrop } from '@/components/ui/Controls';
import { Icon } from '@/components/ui/Icon';
import { HistoricalCard, ProgressBar, SectionTitle } from '@/components/ui/Layout';
import { QuizCard } from '@/components/quiz/QuizCard';
import { EPISODES, EVENTS, getEvent, getPlace, QUESTIONS } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useStatusBar } from '@/hooks/useStatusBar';
import { useTheme } from '@/hooks/useTheme';
import { openNode } from '@/lib/navigation';
import { dailyQuestion, todaysEvent } from '@/services/daily';
import { continueEpisode, exploration } from '@/services/progress';
import { reviewCenter } from '@/services/review';
import { CONTENT_COUNTS, useAppStore } from '@/store/appStore';
import { spacing } from '@/theme';
import { toDayKey } from '@/utils/date';

export default function Home() {
  const { t, l } = useI18n();
  const { c } = useTheme();
  useStatusBar(true);
  const app = useAppStore((s) => s.app);
  const recordAnswer = useAppStore((s) => s.recordAnswer);
  const answerDaily = useAppStore((s) => s.answerDaily);
  const [day] = useState(() => toDayKey(new Date()));
  const [quizOpen, setQuizOpen] = useState(false);

  const stats = exploration(app, CONTENT_COUNTS);
  const current = continueEpisode(app, EPISODES);
  const currentStep = current ? app.episodes[current.id]?.step : undefined;
  const today = todaysEvent(day, EVENTS);
  const featured = getEvent(current?.mainEventId ?? EPISODES[0].mainEventId);
  const question = dailyQuestion(day, QUESTIONS);
  const dailyDone = app.dailyAnswered.includes(day);
  const due = reviewCenter(app.review, new Date().toISOString()).dueCount;
  const recentPlaces = Object.entries(app.discovered.place)
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, 6)
    .map(([id]) => getPlace(id))
    .filter((p) => p !== undefined);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <HeroHeader>
          <AppText variant="label" color={c.gold}>
            {t('home.greeting')}
          </AppText>
          <AppText variant="display" color={c.onNight} accessibilityRole="header">
            {t('app.name')}
          </AppText>
          <AppText variant="body" color={c.onNightMuted}>
            {t('app.tagline')}
          </AppText>
          <View style={styles.progressRow}>
            <AppText variant="small" color={c.onNight}>
              {t('home.episodes', { done: stats.episodesCompleted, total: stats.episodesTotal })}
            </AppText>
            <AppText variant="small" color={c.gold}>
              {t('home.explored', { percent: stats.explored })}
            </AppText>
          </View>
          <ProgressBar onDark progress={stats.explored / 100} color={c.gold} label={`${t('home.progress')}: ${t('home.explored', { percent: stats.explored })}`} />
        </HeroHeader>

        <View style={styles.body}>
          <SearchBar value="" placeholder={t('home.search')} onPress={() => router.push('/search')} />

          {current ? (
            <View style={styles.section}>
              <SectionTitle title={currentStep ? t('home.continue') : t('home.start')} />
              <EpisodeCard episode={current} />
              <Button
                label={currentStep ? `${t('episode.continue')} · ${t(`episode.step.${currentStep}`)}` : t('episode.start')}
                icon="play"
                onPress={() => openNode('episode', current.id)}
              />
            </View>
          ) : (
            <HistoricalCard tone="gold">
              <AppText variant="body">{t('home.allDone')}</AppText>
            </HistoricalCard>
          )}

          {today ? (
            <HistoricalCard tone="night" onPress={() => openNode('event', today.id)} accessibilityLabel={`${t('home.today')}: ${l(today.title)}`}>
              <AppText variant="label" color={c.gold}>
                {t('home.today')}
              </AppText>
              <AppText variant="small" color={c.onNightMuted}>
                {t(`home.todayIntro.${today.era}`)}
              </AppText>
              <AppText variant="title" color={c.onNight}>
                {l(today.title)}
              </AppText>
              <AppText variant="small" color={c.gold}>
                {l(today.date.label)}
              </AppText>
              <AppText variant="body" color={c.onNightMuted} numberOfLines={3}>
                {l(today.summary[0]?.text)}
              </AppText>
              <View style={styles.inline}>
                <AppText variant="bodyBold" color={c.gold}>
                  {t('home.learnMore')}
                </AppText>
                <Icon name="chevron" size={18} color={c.gold} />
              </View>
            </HistoricalCard>
          ) : null}

          {question ? (
            <View style={styles.section}>
              <SectionTitle title={t('home.dailyQuestion')} />
              {quizOpen || !dailyDone ? (
                <HistoricalCard>
                  <QuizCard
                    key={`${day}-${question.id}`}
                    question={question}
                    onResult={(correct) => {
                      setQuizOpen(true);
                      recordAnswer(question, correct, 'daily');
                      answerDaily(day);
                    }}
                    onContinue={() => setQuizOpen(false)}
                  />
                </HistoricalCard>
              ) : (
                <HistoricalCard tone="alt">
                  <View style={styles.inline}>
                    <Icon name="check" size={20} color={c.success} />
                    <AppText variant="body" style={styles.flex}>
                      {t('home.dailyDone')}
                    </AppText>
                  </View>
                </HistoricalCard>
              )}
            </View>
          ) : null}

          {featured ? (
            <View style={styles.section}>
              <SectionTitle title={t('home.featured')} />
              <EventCard event={featured} />
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionTitle title={t('home.recentPlaces')} actionLabel={t('tabs.map')} onAction={() => router.push('/(tabs)/map')} />
            {recentPlaces.length ? (
              <View style={styles.chips}>
                {recentPlaces.map((p) => (
                  <FilterChip key={p.id} label={l(p.name)} icon="pin" selected={false} onPress={() => openNode('place', p.id)} />
                ))}
              </View>
            ) : (
              <AppText variant="small" muted>
                {t('home.recentNone')}
              </AppText>
            )}
          </View>

          <HistoricalCard onPress={() => router.push('/review')} accessibilityLabel={`${t('home.review')}: ${due ? t('home.reviewDue', { count: due }) : t('home.reviewNone')}`}>
            <View style={styles.inline}>
              <Icon name="refresh" size={22} color={c.accent} />
              <View style={styles.flex}>
                <AppText variant="bodyBold">{t('home.review')}</AppText>
                <AppText variant="small" muted>
                  {due ? t('home.reviewDue', { count: due }) : t('home.reviewNone')}
                </AppText>
              </View>
              <Icon name="chevron" size={18} color={c.textMuted} />
            </View>
          </HistoricalCard>
        </View>
      </ScrollView>
      <StatusBarBackdrop />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  body: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.md },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
