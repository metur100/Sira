import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { HistoricalCard, ProgressBar } from '@/components/ui/Layout';
import { PersonName } from '@/components/ui/PersonName';
import { getEpisode, getEvent, getPerson, getPlace, getTheme } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { openNode } from '@/lib/navigation';
import type { Episode, Person, Place, SeerahEvent } from '@/models';
import type { NodeType } from '@/services/connections';
import { useAppStore } from '@/store/appStore';
import { precisionColor, radius, spacing } from '@/theme';

import { SceneView } from './SceneView';

export const NODE_ICON: Record<NodeType | 'source', IconName> = {
  episode: 'book',
  event: 'calendar',
  person: 'feather',
  place: 'pin',
  theme: 'tag',
  source: 'scroll',
};

export function EpisodeCard({ episode, onPress }: { episode: Episode; onPress?: () => void }) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const progress = useAppStore((s) => s.app.episodes[episode.id]);
  const done = !!progress?.completedAt;
  return (
    <HistoricalCard
      onPress={onPress ?? (() => openNode('episode', episode.id))}
      style={styles.episode}
      accessibilityLabel={`${t('episode.label', { number: episode.order })}: ${l(episode.title)}. ${l(episode.subtitle)}${done ? `. ${t('episode.completed')}` : ''}`}
    >
      <SceneView scene={episode.scene} height={96} rounded />
      <View style={styles.episodeBody}>
        <View style={styles.row}>
          <AppText variant="label" color={c.accent} style={styles.flex}>
            {t('episode.label', { number: episode.order })} · {l(episode.period)}
          </AppText>
          {done ? <Icon name="check" size={18} color={c.success} strokeWidth={2.6} /> : null}
        </View>
        <AppText variant="heading">{l(episode.title)}</AppText>
        <AppText variant="small" muted>
          {l(episode.subtitle)}
        </AppText>
      </View>
    </HistoricalCard>
  );
}

export function EventCard({ event, compact }: { event: SeerahEvent; compact?: boolean }) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const discovered = useAppStore((s) => !!s.app.discovered.event[event.id]);
  return (
    <HistoricalCard onPress={() => openNode('event', event.id)} accessibilityLabel={`${t('type.event')}: ${l(event.title)}, ${l(event.date.label)}`}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: c.goldSoft }]}>
          <Icon name="calendar" size={20} color={c.accent} />
        </View>
        <View style={styles.flex}>
          <AppText variant="tiny" color={c.accent}>
            {l(event.date.label)}
          </AppText>
          <AppText variant="bodyBold">{l(event.title)}</AppText>
          {!compact ? (
            <AppText variant="small" muted numberOfLines={2}>
              {l(event.summary[0]?.text)}
            </AppText>
          ) : null}
        </View>
        {discovered ? <Icon name="check" size={16} color={c.success} /> : <Icon name="chevron" size={18} color={c.textMuted} />}
      </View>
    </HistoricalCard>
  );
}

export function PersonCard({ person }: { person: Person }) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const discovered = useAppStore((s) => !!s.app.discovered.person[person.id]);
  return (
    <HistoricalCard onPress={() => openNode('person', person.id)} accessibilityLabel={`${t('type.person')}: ${l(person.name)}. ${l(person.role)}`}>
      <View style={styles.row}>
        <PersonInitial person={person} />
        <View style={styles.flex}>
          <PersonName person={person} />
          <AppText variant="small" muted numberOfLines={2}>
            {l(person.role)}
          </AppText>
        </View>
        {discovered ? <Icon name="check" size={16} color={c.success} /> : <Icon name="chevron" size={18} color={c.textMuted} />}
      </View>
    </HistoricalCard>
  );
}

export function PlaceCard({ place }: { place: Place }) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const discovered = useAppStore((s) => !!s.app.discovered.place[place.id]);
  return (
    <HistoricalCard onPress={() => openNode('place', place.id)} accessibilityLabel={`${t('type.place')}: ${l(place.name)}. ${t(`map.${place.precision}`)}`}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: c.surfaceAlt }]}>
          <Icon name="pin" size={20} color={precisionColor(c, place.precision)} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyBold">{l(place.name)}</AppText>
          <AppText variant="tiny" color={precisionColor(c, place.precision)}>
            {t(`map.${place.precision}`)}
          </AppText>
          <AppText variant="small" muted numberOfLines={2}>
            {l(place.whyItMatters)}
          </AppText>
        </View>
        {discovered ? <Icon name="check" size={16} color={c.success} /> : <Icon name="chevron" size={18} color={c.textMuted} />}
      </View>
    </HistoricalCard>
  );
}

/** Compact card for any connected node – used in the connection view. */
export function ConnectionCard({ type, id, onPress }: { type: NodeType; id: string; onPress?: () => void }) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const title =
    type === 'event'
      ? l(getEvent(id)?.title)
      : type === 'person'
        ? null
        : type === 'place'
          ? l(getPlace(id)?.name)
          : type === 'episode'
            ? l(getEpisode(id)?.title)
            : l(getTheme(id)?.name);
  const person = type === 'person' ? getPerson(id) : undefined;
  const subtitle =
    type === 'event'
      ? l(getEvent(id)?.date.label)
      : type === 'person'
        ? l(person?.role)
        : type === 'episode'
          ? t('episode.label', { number: getEpisode(id)?.order ?? 0 })
          : type === 'place' && getPlace(id)
            ? t(`map.${getPlace(id)!.precision}`)
            : t(`type.${type}`);
  return (
    <HistoricalCard
      onPress={onPress ?? (() => openNode(type, id))}
      style={styles.connection}
      accessibilityLabel={`${t(`type.${type}`)}: ${person ? l(person.name) : title}. ${subtitle}`}
    >
      <View style={styles.row}>
        {person ? <PersonInitial person={person} size={34} /> : <Icon name={NODE_ICON[type]} size={18} color={c.accent} />}
        <View style={styles.flex}>
          {person ? <PersonName person={person} variant="small" /> : <AppText variant="bodyBold">{title}</AppText>}
          <AppText variant="tiny" muted numberOfLines={1}>
            {subtitle}
          </AppText>
        </View>
      </View>
    </HistoricalCard>
  );
}

/**
 * People are represented only by typography – the first letter of their name, and for the Prophet ﷺ
 * the calligraphic ﷺ – never by a portrait, silhouette or figure.
 */
export function PersonInitial({ person, size = 42 }: { person: Person; size?: number }) {
  const { c } = useTheme();
  const { l } = useI18n();
  const prophet = person.honorific === 'saw';
  const letter = prophet ? 'ﷺ' : (l(person.name).replace(/^(The|Die|al-|ʿ)s*/i, '').charAt(0) || '·').toUpperCase();
  return (
    <View
      style={[styles.initial, { width: size, height: size, borderRadius: size / 2, backgroundColor: prophet ? c.goldSoft : c.surfaceAlt, borderColor: c.border }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <AppText variant={prophet ? 'bodyBold' : 'heading'} color={c.accent} script={prophet ? 'arabic' : 'auto'} style={prophet ? styles.saw : undefined}>
        {letter}
      </AppText>
    </View>
  );
}

export function TimelineItem({ event, first, last }: { event: SeerahEvent; first?: boolean; last?: boolean }) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const discovered = useAppStore((s) => !!s.app.discovered.event[event.id]);
  const certain = event.date.certainty === 'established';
  return (
    <View style={styles.tlRow}>
      <View style={styles.tlRail}>
        <View style={[styles.tlLine, { backgroundColor: first ? 'transparent' : c.border }]} />
        <View
          style={[
            styles.tlDot,
            { borderColor: c.accent, backgroundColor: discovered ? c.accent : c.background },
          ]}
        />
        <View style={[styles.tlLine, styles.flex, { backgroundColor: last ? 'transparent' : c.border }]} />
      </View>
      <View style={[styles.flex, styles.tlCard]}>
        <HistoricalCard onPress={() => openNode('event', event.id)} accessibilityLabel={`${l(event.date.label)}, ${t(`certainty.${event.date.certainty}`)}: ${l(event.title)}`}>
          <View style={styles.row}>
            <AppText variant="subheading" color={c.accent} style={styles.flex}>
              {l(event.date.label)}
            </AppText>
            {!certain ? (
              <View style={[styles.certainty, { backgroundColor: c.interpretationSoft }]}>
                <AppText variant="tiny" color={c.interpretation}>
                  {t(`certainty.${event.date.certainty}`)}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText variant="heading">{l(event.title)}</AppText>
          <AppText variant="small" muted numberOfLines={3}>
            {l(event.summary[0]?.text)}
          </AppText>
        </HistoricalCard>
      </View>
    </View>
  );
}

export function StatTile({ label, value, progress }: { label: string; value: string; progress?: number }) {
  const { c } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: c.surface, borderColor: c.border }]} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="title" color={c.accent}>
        {value}
      </AppText>
      <AppText variant="tiny" muted>
        {label}
      </AppText>
      {progress !== undefined ? <ProgressBar progress={progress} height={5} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  episode: { padding: 0, overflow: 'hidden', gap: 0 },
  episodeBody: { padding: spacing.lg, gap: 4 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  initial: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saw: { fontSize: 22, lineHeight: 30 },
  connection: { padding: spacing.md },
  tlRow: { flexDirection: 'row', alignItems: 'stretch' },
  tlRail: { width: 28, alignItems: 'center' },
  tlLine: { width: 2, height: 22 },
  tlDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2.5 },
  tlCard: { paddingBottom: spacing.md },
  certainty: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  stat: { flexBasis: '47%', flexGrow: 1, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: 4 },
});
