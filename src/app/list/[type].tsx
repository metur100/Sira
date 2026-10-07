import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { EpisodeCard, EventCard, PersonCard, PlaceCard } from '@/components/content/Cards';
import { AppText } from '@/components/ui/AppText';
import { SearchBar } from '@/components/ui/Controls';
import { HistoricalCard, Screen, TopBar } from '@/components/ui/Layout';
import { EPISODES, EVENTS, PEOPLE, PLACES, THEMES } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import type { TranslationKey } from '@/localization/i18n';
import { openNode } from '@/lib/navigation';
import { normalize } from '@/services/search';
import { spacing } from '@/theme';

const TITLES: Record<string, TranslationKey> = {
  person: 'explore.people',
  place: 'explore.places',
  event: 'explore.events',
  theme: 'explore.themes',
  episode: 'explore.episodes',
};

interface Row {
  id: string;
  name: string;
  render: () => React.ReactElement;
}

/** Browsable list of people, places, events, themes or episodes, with a quick filter. */
export default function ListScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const { t, l } = useI18n();
  const [query, setQuery] = useState('');

  const rows = useMemo<Row[]>(() => {
    switch (type) {
      case 'person':
        return PEOPLE.map((p) => ({ id: p.id, name: l(p.name), render: () => <PersonCard person={p} /> }));
      case 'place':
        return PLACES.map((p) => ({ id: p.id, name: l(p.name), render: () => <PlaceCard place={p} /> }));
      case 'event':
        return EVENTS.map((e) => ({ id: e.id, name: l(e.title), render: () => <EventCard event={e} /> }));
      case 'episode':
        return EPISODES.map((e) => ({ id: e.id, name: l(e.title), render: () => <EpisodeCard episode={e} /> }));
      case 'theme':
        return THEMES.map((th) => ({
          id: th.id,
          name: l(th.name),
          render: () => (
            <HistoricalCard onPress={() => openNode('theme', th.id)} accessibilityLabel={l(th.name)}>
              <AppText variant="heading">{l(th.name)}</AppText>
              <AppText variant="small" muted>
                {l(th.description)}
              </AppText>
            </HistoricalCard>
          ),
        }));
      default:
        return [];
    }
  }, [type, l]);

  const filtered = query.trim() ? rows.filter((r) => normalize(r.name).includes(normalize(query))) : rows;

  return (
    <Screen header={<TopBar title={t(TITLES[String(type)] ?? 'explore.title')} />} scroll={false}>
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => item.render()}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <SearchBar value={query} onChangeText={setQuery} placeholder={t('search.placeholder')} />
          </View>
        }
        contentContainerStyle={styles.list}
        initialNumToRender={10}
        keyboardShouldPersistTaps="handled"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { paddingBottom: spacing.md },
  sep: { height: spacing.md },
});
