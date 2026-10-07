import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ConnectionView } from '@/components/content/ConnectionView';
import { AppText } from '@/components/ui/AppText';
import { HeroHeader, SearchBar, StatusBarBackdrop } from '@/components/ui/Controls';
import { Icon, type IconName } from '@/components/ui/Icon';
import { HistoricalCard, SectionTitle } from '@/components/ui/Layout';
import { EPISODES, EVENTS, getEvent, PEOPLE, PLACES, THEMES } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useStatusBar } from '@/hooks/useStatusBar';
import { useTheme } from '@/hooks/useTheme';
import type { TranslationKey } from '@/localization/i18n';
import { openConnections, openNode } from '@/lib/navigation';
import { connectionChain } from '@/services/connections';
import { spacing } from '@/theme';

const CATEGORIES: { type: string; icon: IconName; label: TranslationKey; count: number }[] = [
  { type: 'person', icon: 'people', label: 'explore.people', count: PEOPLE.length },
  { type: 'place', icon: 'pin', label: 'explore.places', count: PLACES.length },
  { type: 'event', icon: 'calendar', label: 'explore.events', count: EVENTS.length },
  { type: 'theme', icon: 'tag', label: 'explore.themes', count: THEMES.length },
  { type: 'episode', icon: 'book', label: 'explore.episodes', count: EPISODES.length },
];

export default function ExploreTab() {
  const { t, l } = useI18n();
  const { c } = useTheme();
  useStatusBar(true);
  const content = { episodes: EPISODES, events: EVENTS, people: PEOPLE, places: PLACES, themes: THEMES };
  const example = getEvent('hijrah');

  return (
    <View style={styles.fillRoot}>
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.scroll}>
      <HeroHeader>
        <AppText variant="display" color={c.onNight} accessibilityRole="header">
          {t('explore.title')}
        </AppText>
        <AppText variant="body" color={c.onNightMuted}>
          {t('explore.subtitle')}
        </AppText>
      </HeroHeader>
      <View style={styles.body}>
        <SearchBar value="" placeholder={t('search.placeholder')} onPress={() => router.push('/search')} />

        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <HistoricalCard
              key={cat.type}
              style={styles.tile}
              onPress={() => router.push({ pathname: '/list/[type]', params: { type: cat.type } })}
              accessibilityLabel={`${t(cat.label)}, ${cat.count}`}
            >
              <Icon name={cat.icon} size={26} color={c.accent} />
              <AppText variant="subheading">{t(cat.label)}</AppText>
              <AppText variant="tiny" muted>
                {cat.count}
              </AppText>
            </HistoricalCard>
          ))}
          <HistoricalCard style={styles.tile} onPress={() => router.push('/bookmarks')} accessibilityLabel={t('explore.bookmarks')}>
            <Icon name="bookmark" size={26} color={c.accent} />
            <AppText variant="subheading">{t('explore.bookmarks')}</AppText>
          </HistoricalCard>
        </View>

        <HistoricalCard onPress={() => router.push('/review')} accessibilityLabel={t('explore.review')}>
          <View style={styles.row}>
            <Icon name="refresh" size={24} color={c.accent} />
            <AppText variant="bodyBold" style={styles.flex}>
              {t('explore.review')}
            </AppText>
            <Icon name="chevron" size={18} color={c.textMuted} />
          </View>
        </HistoricalCard>

        {example ? (
          <View style={styles.section}>
            <SectionTitle title={t('connections.title')} actionLabel={t('common.seeAll')} onAction={() => openConnections('event', example.id)} />
            <AppText variant="small" muted>
              {t('connections.chain')} – {l(example.title)}
            </AppText>
            <ConnectionView
              groups={connectionChain(example.id, content)}
              titles={[t('type.event'), t('explore.people'), t('explore.places'), t('event.related')]}
              onNodePress={(type, id) => (type === 'event' && id === example.id ? openNode(type, id) : openConnections(type, id))}
            />
          </View>
        ) : null}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { flexBasis: '46%', flexGrow: 1, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  section: { gap: spacing.md },
});
