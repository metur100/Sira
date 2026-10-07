import { useMemo, useState } from 'react';
import { ScrollView, SectionList, StyleSheet, View } from 'react-native';

import { TimelineItem } from '@/components/content/Cards';
import { AppText } from '@/components/ui/AppText';
import { FilterChip, HeroHeader, StatusBarBackdrop } from '@/components/ui/Controls';
import { EVENTS, THEMES } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useStatusBar } from '@/hooks/useStatusBar';
import { useTheme } from '@/hooks/useTheme';
import type { Era } from '@/models';
import { timelineSections } from '@/services/timeline';
import { spacing } from '@/theme';

type Filter = { kind: 'all' } | { kind: 'era'; era: Era } | { kind: 'theme'; id: string };

export default function TimelineTab() {
  const { t, l } = useI18n();
  const { c } = useTheme();
  useStatusBar(true);
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });

  const sections = useMemo(
    () =>
      timelineSections(EVENTS, (e) =>
        filter.kind === 'all' ? true : filter.kind === 'era' ? e.era === filter.era : e.themeIds.includes(filter.id),
      ).map((s) => ({ era: s.era, data: s.events })),
    [filter],
  );
  const isSel = (f: Filter) => JSON.stringify(f) === JSON.stringify(filter);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        initialNumToRender={8}
        windowSize={7}
        ListHeaderComponent={
          <View style={styles.header}>
            <HeroHeader>
              <AppText variant="display" color={c.onNight} accessibilityRole="header">
                {t('timeline.title')}
              </AppText>
              <AppText variant="body" color={c.onNightMuted}>
                {t('timeline.subtitle')}
              </AppText>
            </HeroHeader>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <FilterChip label={t('timeline.all')} selected={isSel({ kind: 'all' })} onPress={() => setFilter({ kind: 'all' })} />
              {(['before', 'makkah', 'madinah'] as const).map((era) => (
                <FilterChip key={era} label={t(`era.${era}`)} selected={isSel({ kind: 'era', era })} onPress={() => setFilter({ kind: 'era', era })} />
              ))}
              {THEMES.map((th) => (
                <FilterChip key={th.id} icon="tag" label={l(th.name)} selected={isSel({ kind: 'theme', id: th.id })} onPress={() => setFilter({ kind: 'theme', id: th.id })} />
              ))}
            </ScrollView>
            <AppText variant="small" muted style={styles.legend}>
              {t('timeline.legend')}
            </AppText>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <AppText variant="label" color={c.accent} style={styles.sectionHeader} accessibilityRole="header">
            {t(`era.${section.era}`)}
          </AppText>
        )}
        renderItem={({ item, index, section }) => (
          <View style={styles.item}>
            <TimelineItem event={item} first={index === 0} last={index === section.data.length - 1} />
          </View>
        )}
        contentContainerStyle={styles.list}
      />
      <StatusBarBackdrop />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  legend: { paddingHorizontal: spacing.lg },
  sectionHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  item: { paddingHorizontal: spacing.lg },
  list: { paddingBottom: spacing.xxl },
});
