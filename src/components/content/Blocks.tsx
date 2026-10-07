import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { BookmarkButton } from '@/components/ui/Controls';
import { Icon, type IconName } from '@/components/ui/Icon';
import { HistoricalCard } from '@/components/ui/Layout';
import { getSource, resolve } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { openNode } from '@/lib/navigation';
import type { BlockKind, ContentBlock, EpisodeSources, Source } from '@/models';
import { blockColors, radius, spacing } from '@/theme';

const KIND_ICON: Record<BlockKind, IconName> = { fact: 'check', interpretation: 'scroll', reflection: 'feather' };

export function KindTag({ kind }: { kind: BlockKind }) {
  const { c } = useTheme();
  const { t } = useI18n();
  const col = blockColors(c, kind);
  return (
    <View style={[styles.tag, { backgroundColor: col.bg }]}>
      <Icon name={KIND_ICON[kind]} size={13} color={col.fg} strokeWidth={2.4} />
      <AppText variant="label" color={col.fg}>
        {t(`kind.${kind}`)}
      </AppText>
    </View>
  );
}

/** Short references shown under a statement, e.g. "Quran 96:1–5 · Sahih al-Bukhari 3". */
export function sourceShortLabel(source: Source): string {
  if (source.type === 'quran') return `Quran ${source.reference.replace(/^Surah\s+/, '')}`;
  if (source.type === 'hadith') {
    const number = source.reference.match(/^Hadith\s+([\d–-]+)/)?.[1];
    return number ? `${source.title} ${number}` : source.title;
  }
  return source.author ? `${source.author.split(' (')[0]}` : source.title;
}

/** A statement labelled as established fact, historical interpretation or reflection, with its sources. */
export function BlockView({ block }: { block: ContentBlock }) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const col = blockColors(c, block.kind);
  const sources = resolve(block.sourceIds, getSource);
  return (
    <View style={[styles.block, { borderLeftColor: col.fg, backgroundColor: c.surface }]} accessibilityLabel={`${t(`kind.${block.kind}`)}. ${l(block.text)}`}>
      <KindTag kind={block.kind} />
      <AppText variant="body">{l(block.text)}</AppText>
      {sources.length ? (
        <View style={styles.refs}>
          {sources.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => openNode('source', s.id)}
              accessibilityRole="link"
              accessibilityLabel={`${t('type.source')}: ${sourceShortLabel(s)}`}
              style={[styles.ref, { borderColor: c.border }]}
              hitSlop={4}
            >
              <AppText variant="tiny" color={c.accent}>
                {sourceShortLabel(s)}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function KindLegend({ onNight }: { onNight?: boolean }) {
  const { c } = useTheme();
  const { t } = useI18n();
  return (
    <View style={styles.legend}>
      {(['fact', 'interpretation', 'reflection'] as const).map((kind) => (
        <View key={kind} style={[styles.legendRow, { backgroundColor: onNight ? 'rgba(255,255,255,0.06)' : c.surface }]}>
          <KindTag kind={kind} />
          <AppText variant="small" color={onNight ? c.onNightMuted : c.textMuted}>
            {t(`kind.${kind}.desc`)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export function SourceCard({ source, compact }: { source: Source; compact?: boolean }) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const host = source.url ? new URL(source.url).host : null;
  return (
    <HistoricalCard>
      <View style={styles.sourceHead}>
        <View style={[styles.typeChip, { backgroundColor: c.goldSoft }]}>
          <AppText variant="label" color={c.accent}>
            {t(`source.type.${source.type}`)}
          </AppText>
        </View>
        <View style={styles.flex} />
        <BookmarkButton type="source" id={source.id} />
      </View>
      <AppText variant="bodyBold">{source.type === 'quran' ? t('source.type.quran') : source.title}</AppText>
      {source.author ? (
        <AppText variant="small" muted>
          {source.author}
        </AppText>
      ) : null}
      <AppText variant="small">{source.reference}</AppText>
      {!compact && source.notes ? (
        <AppText variant="small" muted>
          {l(source.notes)}
        </AppText>
      ) : null}
      {source.url && host ? (
        <Button
          label={t('sources.open')}
          variant="secondary"
          icon="external"
          compact
          accessibilityHint={t('sources.openHint', { host })}
          onPress={() => Linking.openURL(source.url as string).catch(() => undefined)}
        />
      ) : null}
    </HistoricalCard>
  );
}

/** Sources of an episode, grouped as primary, secondary and further reading. */
export function SourceSections({ sources }: { sources: EpisodeSources }) {
  const { t } = useI18n();
  const groups = [
    { key: 'primary', title: t('sources.primary'), ids: sources.primary },
    { key: 'secondary', title: t('sources.secondary'), ids: sources.secondary },
    { key: 'further', title: t('sources.further'), ids: sources.further },
  ].filter((g) => g.ids.length > 0);
  return (
    <View style={styles.sections}>
      {groups.map((g) => (
        <View key={g.key} style={styles.section}>
          <AppText variant="label" muted accessibilityRole="header">
            {g.title}
          </AppText>
          {resolve(g.ids, getSource).map((s) => (
            <SourceCard key={s.id} source={s} compact />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  block: { borderLeftWidth: 3, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  refs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ref: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, minHeight: 32, justifyContent: 'center' },
  legend: { gap: spacing.sm },
  legendRow: { borderRadius: radius.md, padding: spacing.md, gap: 6 },
  sourceHead: { flexDirection: 'row', alignItems: 'center' },
  typeChip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  sections: { gap: spacing.lg },
  section: { gap: spacing.sm },
});
