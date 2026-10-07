import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BadgeIcon } from '@/components/content/Badges';
import { StatTile } from '@/components/content/Cards';
import { AppText } from '@/components/ui/AppText';
import { HeroHeader, LinkRow, StatusBarBackdrop } from '@/components/ui/Controls';
import { Icon } from '@/components/ui/Icon';
import { HistoricalCard, ProgressBar, SectionTitle } from '@/components/ui/Layout';
import { EPISODES, EVENTS, getEpisode, PEOPLE, PLACES } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useStatusBar } from '@/hooks/useStatusBar';
import { useTheme } from '@/hooks/useTheme';
import { LOCALE_TAGS } from '@/localization/i18n';
import { openNode } from '@/lib/navigation';
import { BADGES, exploration } from '@/services/progress';
import { CONTENT_COUNTS, useAppStore } from '@/store/appStore';
import { spacing } from '@/theme';

export default function ProfileTab() {
  const { t, l, language } = useI18n();
  const { c } = useTheme();
  useStatusBar(true);
  const app = useAppStore((s) => s.app);
  const stats = exploration(app, CONTENT_COUNTS);
  const completed = EPISODES.filter((e) => app.episodes[e.id]?.completedAt);
  const date = (iso: string) => new Date(iso).toLocaleDateString(LOCALE_TAGS[language], { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={styles.fillRoot}>
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.scroll}>
      <HeroHeader>
        <AppText variant="display" color={c.onNight} accessibilityRole="header">
          {t('profile.title')}
        </AppText>
        <AppText variant="label" color={c.gold}>
          {t('profile.progress')}
        </AppText>
        <View style={styles.heroRow}>
          <AppText variant="title" color={c.onNight}>
            {t('home.episodes', { done: stats.episodesCompleted, total: stats.episodesTotal })}
          </AppText>
          <AppText variant="subheading" color={c.gold}>
            {t('home.explored', { percent: stats.explored })}
          </AppText>
        </View>
        <ProgressBar onDark progress={stats.explored / 100} color={c.gold} />
        <View style={styles.row}>
          <Icon name="star" size={18} color={c.gold} />
          <AppText variant="small" color={c.onNightMuted}>
            {t('profile.points')}: {app.points}
          </AppText>
        </View>
      </HeroHeader>

      <View style={styles.body}>
        <View style={styles.grid}>
          <StatTile label={t('stats.events')} value={`${stats.eventsDiscovered}/${EVENTS.length}`} progress={stats.eventsDiscovered / EVENTS.length} />
          <StatTile label={t('stats.people')} value={`${stats.peopleDiscovered}/${PEOPLE.length}`} progress={stats.peopleDiscovered / PEOPLE.length} />
          <StatTile label={t('stats.places')} value={`${stats.placesDiscovered}/${PLACES.length}`} progress={stats.placesDiscovered / PLACES.length} />
          <StatTile label={t('profile.reflections')} value={String(stats.reflections)} />
        </View>

        <View style={styles.section}>
          <SectionTitle title={t('profile.completed')} />
          {completed.length ? (
            completed.map((e) => (
              <HistoricalCard key={e.id} onPress={() => openNode('episode', e.id)} accessibilityLabel={`${l(e.title)}, ${t('episode.bestScore', { percent: app.episodes[e.id]?.bestScore ?? 0 })}`}>
                <View style={styles.row}>
                  <Icon name="check" size={18} color={c.success} />
                  <AppText variant="bodyBold" style={styles.flex}>
                    {t('episode.label', { number: e.order })}: {l(e.title)}
                  </AppText>
                  <AppText variant="small" color={c.accent}>
                    {app.episodes[e.id]?.bestScore ?? 0}%
                  </AppText>
                </View>
              </HistoricalCard>
            ))
          ) : (
            <AppText variant="small" muted>
              {t('profile.noneCompleted')}
            </AppText>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle title={t('profile.quizResults')} />
          {app.quizResults.length ? (
            <HistoricalCard>
              {app.quizResults.slice(0, 8).map((r, i) => (
                <View key={`${r.episodeId}-${r.date}-${i}`} style={styles.row} accessible accessibilityLabel={`${l(getEpisode(r.episodeId)?.title)}: ${r.correct}/${r.total}`}>
                  <AppText variant="small" style={styles.flex} numberOfLines={1}>
                    {l(getEpisode(r.episodeId)?.title)}
                  </AppText>
                  <AppText variant="tiny" muted>
                    {date(r.date)}
                  </AppText>
                  <AppText variant="bodyBold" color={r.percent >= 70 ? c.success : c.interpretation}>
                    {r.correct}/{r.total}
                  </AppText>
                </View>
              ))}
            </HistoricalCard>
          ) : (
            <AppText variant="small" muted>
              {t('profile.noQuiz')}
            </AppText>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle title={t('profile.badges')} />
          <View style={styles.badges}>
            {BADGES.map((b) => {
              const earned = app.badges[b.id];
              return (
                <View
                  key={b.id}
                  style={styles.badge}
                  accessible
                  accessibilityLabel={`${t(`badge.${b.id}.name`)}. ${t(`badge.${b.id}.desc`)} ${earned ? t('badges.earned', { date: date(earned) }) : t('badges.locked')}`}
                >
                  <BadgeIcon id={b.id} earned={!!earned} size={58} />
                  <AppText variant="tiny" align="center" muted={!earned}>
                    {t(`badge.${b.id}.name`)}
                  </AppText>
                </View>
              );
            })}
          </View>
        </View>

        <HistoricalCard>
          <LinkRow icon="bookmark" label={t('profile.bookmarks')} value={String(app.bookmarks.length)} onPress={() => router.push('/bookmarks')} />
          <LinkRow icon="feather" label={t('profile.reflections')} value={String(stats.reflections)} onPress={() => router.push('/reflections')} />
          <LinkRow icon="refresh" label={t('profile.review')} onPress={() => router.push('/review')} />
          <LinkRow icon="settings" label={t('profile.settings')} onPress={() => router.push('/settings')} />
        </HistoricalCard>
      </View>
    </ScrollView>
    <StatusBarBackdrop />
    </View>
  );
}

const styles = StyleSheet.create({
  fillRoot: { flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  body: { padding: spacing.lg, gap: spacing.xl },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 32 },
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  section: { gap: spacing.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
  badge: { width: '22%', alignItems: 'center', gap: 4 },
});
