import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { ConnectionGroup, NodeType } from '@/services/connections';
import { radius, spacing } from '@/theme';

import { ConnectionCard } from './Cards';

const GROUP_TITLE: Record<NodeType, 'explore.people' | 'explore.places' | 'explore.events' | 'explore.episodes' | 'explore.themes'> = {
  person: 'explore.people',
  place: 'explore.places',
  event: 'explore.events',
  episode: 'explore.episodes',
  theme: 'explore.themes',
};

/**
 * Relationship view: groups of connected nodes joined by a vertical line,
 * so the Seerah reads as a connected story rather than isolated facts.
 */
export function ConnectionView({
  groups,
  onNodePress,
  titles,
}: {
  groups: ConnectionGroup[];
  onNodePress?: (type: NodeType, id: string) => void;
  /** Optional custom titles per group index (e.g. for the event chain). */
  titles?: string[];
}) {
  const { c } = useTheme();
  const { t } = useI18n();
  return (
    <View style={styles.root}>
      {groups.map((group, index) => (
        <View key={`${group.type}-${index}`} style={styles.group}>
          <View style={styles.rail}>
            <View style={[styles.node, { backgroundColor: c.accent }]} />
            {index < groups.length - 1 ? <View style={[styles.line, { backgroundColor: c.border }]} /> : null}
          </View>
          <View style={styles.flex}>
            <AppText variant="label" color={c.accent} accessibilityRole="header">
              {titles?.[index] ?? t(GROUP_TITLE[group.type])}
            </AppText>
            <View style={styles.cards}>
              {group.nodes.map((n) => (
                <ConnectionCard key={`${n.type}-${n.id}`} type={n.type} id={n.id} onPress={onNodePress ? () => onNodePress(n.type, n.id) : undefined} />
              ))}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 0 },
  flex: { flex: 1, gap: spacing.sm, paddingBottom: spacing.lg },
  group: { flexDirection: 'row', gap: spacing.md },
  rail: { width: 14, alignItems: 'center', paddingTop: 3 },
  node: { width: 12, height: 12, borderRadius: radius.pill },
  line: { width: 2, flex: 1, marginTop: 4 },
  cards: { gap: spacing.sm },
});
