import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ConnectionCard, EpisodeCard } from '@/components/content/Cards';
import { ChapterHeader, EmptyState, Screen, SectionTitle, TopBar } from '@/components/ui/Layout';
import { episodesOfTheme, eventsOfTheme, getTheme } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { sortChronologically } from '@/services/timeline';
import { spacing } from '@/theme';

export default function ThemeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, l } = useI18n();
  const theme = getTheme(String(id));

  if (!theme) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="tag" title={t('theme.notFound')} actionLabel={t('common.back')} onAction={() => router.back()} />
      </Screen>
    );
  }

  const episodes = episodesOfTheme(theme.id);
  const events = sortChronologically(eventsOfTheme(theme.id));

  return (
    <Screen header={<TopBar title={t('type.theme')} />}>
      <ChapterHeader label={t('type.theme')} title={l(theme.name)} subtitle={l(theme.description)} />
      {episodes.length ? (
        <View style={styles.section}>
          <SectionTitle title={t('theme.episodes')} />
          {episodes.map((e) => (
            <EpisodeCard key={e.id} episode={e} />
          ))}
        </View>
      ) : null}
      {events.length ? (
        <View style={styles.section}>
          <SectionTitle title={t('theme.events')} />
          {events.map((e) => (
            <ConnectionCard key={e.id} type="event" id={e.id} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
});
