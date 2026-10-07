import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { BlockView, SourceCard } from '@/components/content/Blocks';
import { ConnectionCard } from '@/components/content/Cards';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { BookmarkButton, FilterChip } from '@/components/ui/Controls';
import { ChapterHeader, EmptyState, HistoricalCard, Screen, SectionTitle, TopBar } from '@/components/ui/Layout';
import { getEvent, getSource, getTheme, resolve } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { openConnections, openNode } from '@/lib/navigation';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme';

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, l } = useI18n();
  const { c } = useTheme();
  const event = getEvent(String(id));
  const discover = useAppStore((s) => s.discover);

  useEffect(() => {
    if (event) discover('event', [event.id]);
  }, [event, discover]);

  if (!event) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="calendar" title={t('event.notFound')} actionLabel={t('common.back')} onAction={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen header={<TopBar title={t('type.event')} right={<BookmarkButton type="event" id={event.id} />} />}>
      <ChapterHeader label={`${t(`era.${event.era}`)}`} title={l(event.title)} />
      <HistoricalCard tone="alt">
        <AppText variant="label" muted>
          {t('event.date')}
        </AppText>
        <AppText variant="heading" color={c.accent}>
          {l(event.date.label)}
        </AppText>
        <AppText variant="tiny" color={event.date.certainty === 'established' ? c.success : c.interpretation}>
          {t(`certainty.${event.date.certainty}`)}
        </AppText>
        {event.date.note ? (
          <AppText variant="small" muted>
            {l(event.date.note)}
          </AppText>
        ) : null}
      </HistoricalCard>

      <SectionTitle title={t('event.summary')} />
      {event.summary.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}

      <Button label={t('connections.title')} variant="secondary" icon="link" onPress={() => openConnections('event', event.id)} />

      {event.peopleIds.length ? (
        <View style={styles.section}>
          <SectionTitle title={t('event.people')} />
          {event.peopleIds.map((pid) => (
            <ConnectionCard key={pid} type="person" id={pid} />
          ))}
        </View>
      ) : null}
      {event.placeIds.length ? (
        <View style={styles.section}>
          <SectionTitle title={t('event.places')} />
          {event.placeIds.map((pid) => (
            <ConnectionCard key={pid} type="place" id={pid} />
          ))}
        </View>
      ) : null}
      {event.episodeId ? (
        <View style={styles.section}>
          <SectionTitle title={t('event.episode')} />
          <ConnectionCard type="episode" id={event.episodeId} />
        </View>
      ) : null}
      {event.relatedEventIds.length ? (
        <View style={styles.section}>
          <SectionTitle title={t('event.related')} />
          {event.relatedEventIds.map((eid) => (
            <ConnectionCard key={eid} type="event" id={eid} />
          ))}
        </View>
      ) : null}
      {event.themeIds.length ? (
        <View style={styles.section}>
          <SectionTitle title={t('event.themes')} />
          <View style={styles.chips}>
            {resolve(event.themeIds, getTheme).map((th) => (
              <FilterChip key={th.id} icon="tag" label={l(th.name)} selected={false} onPress={() => openNode('theme', th.id)} />
            ))}
          </View>
        </View>
      ) : null}
      <View style={styles.section}>
        <SectionTitle title={t('event.sources')} />
        {resolve(event.sourceIds, getSource).map((s) => (
          <SourceCard key={s.id} source={s} compact />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
