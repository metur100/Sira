import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ConnectionCard } from '@/components/content/Cards';
import { ConnectionView } from '@/components/content/ConnectionView';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ChapterHeader, EmptyState, Screen, TopBar } from '@/components/ui/Layout';
import { EPISODES, EVENTS, PEOPLE, PLACES, THEMES } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { openNode } from '@/lib/navigation';
import { connectionsOf, type NodeType } from '@/services/connections';
import { radius, spacing } from '@/theme';

const TYPES: readonly NodeType[] = ['event', 'person', 'place', 'episode', 'theme'];
const CONTENT = { episodes: EPISODES, events: EVENTS, people: PEOPLE, places: PLACES, themes: THEMES };

/**
 * "How is everything connected?" – an explorable relationship view. Tapping a connected card
 * moves the centre to it (Event → People → Place → Related Event → …).
 */
export default function ConnectionsScreen() {
  const params = useLocalSearchParams<{ type: string; id: string }>();
  const { t } = useI18n();
  const { c } = useTheme();
  const type = TYPES.includes(params.type as NodeType) ? (params.type as NodeType) : null;
  const id = String(params.id);
  const groups = type ? connectionsOf({ type, id }, CONTENT) : [];

  return (
    <Screen header={<TopBar title={t('connections.title')} />}>
      <ChapterHeader title={t('connections.title')} subtitle={t('connections.subtitle')} />
      {type ? (
        <>
          <View style={[styles.center, { borderColor: c.accent }]}>
            <AppText variant="label" color={c.accent}>
              {t(`type.${type}`)}
            </AppText>
            <ConnectionCard type={type} id={id} onPress={() => openNode(type, id)} />
            <Button label={t('common.seeAll')} variant="ghost" compact iconRight="chevron" onPress={() => openNode(type, id)} />
          </View>
          {groups.length ? (
            <ConnectionView groups={groups} onNodePress={(nt, nid) => router.push({ pathname: '/connections/[type]/[id]', params: { type: nt, id: nid } })} />
          ) : (
            <EmptyState icon="link" title={t('search.empty', { query: '' })} />
          )}
        </>
      ) : (
        <EmptyState icon="link" title={t('notFound.title')} actionLabel={t('common.back')} onAction={() => router.back()} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
});
