import { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ConnectionCard } from '@/components/content/Cards';
import { AppText } from '@/components/ui/AppText';
import { SearchBar } from '@/components/ui/Controls';
import { EmptyState, Screen, TopBar } from '@/components/ui/Layout';
import { EPISODES, EVENTS, PEOPLE, PLACES, THEMES } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { search } from '@/services/search';
import { spacing } from '@/theme';

const CONTENT = { episodes: EPISODES, events: EVENTS, people: PEOPLE, places: PLACES, themes: THEMES };

/** Search across episodes, events, people, places and themes (all languages). */
export default function SearchScreen() {
  const { t, language } = useI18n();
  const { c } = useTheme();
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const hits = useMemo(() => search(deferred, language, CONTENT), [deferred, language]);

  return (
    <Screen header={<TopBar title={t('search.title')} />} scroll={false}>
      <View style={styles.bar}>
        <SearchBar value={query} onChangeText={setQuery} placeholder={t('search.placeholder')} autoFocus />
      </View>
      <FlatList
        data={hits}
        keyExtractor={(h) => `${h.type}-${h.id}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item, index }) => (
          <View style={styles.item}>
            {item.related && (index === 0 || !hits[index - 1].related) ? (
              <AppText variant="label" color={c.accent} style={styles.related}>
                {t('search.related')}
              </AppText>
            ) : null}
            <ConnectionCard type={item.type} id={item.id} />
          </View>
        )}
        ListEmptyComponent={
          query.trim().length >= 2 ? (
            <EmptyState icon="search" title={t('search.empty', { query: query.trim() })} />
          ) : (
            <AppText variant="small" muted style={styles.hint}>
              {t('search.hint')}
            </AppText>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sep: { height: spacing.sm },
  item: { gap: spacing.sm },
  related: { marginTop: spacing.md },
  hint: { padding: spacing.sm },
});
