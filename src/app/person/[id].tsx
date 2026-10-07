import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { BlockView, SourceCard } from '@/components/content/Blocks';
import { ConnectionCard, PersonInitial } from '@/components/content/Cards';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { BookmarkButton } from '@/components/ui/Controls';
import { EmptyState, HistoricalCard, Screen, SectionTitle, TopBar } from '@/components/ui/Layout';
import { Ornament } from '@/components/ui/Ornament';
import { PersonName } from '@/components/ui/PersonName';
import { episodesOfPerson, eventsOfPerson, getPerson, getSource, resolve } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { openConnections } from '@/lib/navigation';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme';

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, l } = useI18n();
  const { c } = useTheme();
  const person = getPerson(String(id));
  const discover = useAppStore((s) => s.discover);

  useEffect(() => {
    if (person) discover('person', [person.id]);
  }, [person, discover]);

  if (!person) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="people" title={t('person.notFound')} actionLabel={t('common.back')} onAction={() => router.back()} />
      </Screen>
    );
  }

  const events = eventsOfPerson(person.id);
  const episodes = episodesOfPerson(person.id);

  return (
    <Screen header={<TopBar title={t('type.person')} right={<BookmarkButton type="person" id={person.id} />} />}>
      <View style={styles.head}>
        <PersonInitial person={person} size={64} />
        <View style={styles.flex}>
          <PersonName person={person} variant="title" />
          <AppText variant="body" color={c.accent} script="arabic">
            {person.arabicName}
          </AppText>
        </View>
      </View>
      <Ornament color={c.accent} />
      <HistoricalCard tone="alt">
        <AppText variant="label" muted>
          {t('person.role')}
        </AppText>
        <AppText variant="body">{l(person.role)}</AppText>
        <AppText variant="label" muted>
          {t('person.relationship')}
        </AppText>
        <AppText variant="body">{l(person.relationship)}</AppText>
      </HistoricalCard>

      <SectionTitle title={t('person.biography')} />
      {person.bio.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}

      <Button label={t('connections.title')} variant="secondary" icon="link" onPress={() => openConnections('person', person.id)} />

      {events.length ? (
        <View style={styles.section}>
          <SectionTitle title={t('person.events')} />
          {events.map((e) => (
            <ConnectionCard key={e.id} type="event" id={e.id} />
          ))}
        </View>
      ) : null}
      {episodes.length ? (
        <View style={styles.section}>
          <SectionTitle title={t('person.episodes')} />
          {episodes.map((e) => (
            <ConnectionCard key={e.id} type="episode" id={e.id} />
          ))}
        </View>
      ) : null}
      <View style={styles.section}>
        <SectionTitle title={t('event.sources')} />
        {resolve(person.sourceIds, getSource).map((s) => (
          <SourceCard key={s.id} source={s} compact />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  section: { gap: spacing.sm },
});
