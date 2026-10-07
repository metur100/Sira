import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { BookmarkButton } from '@/components/ui/Controls';
import { getPlace, episodesAtPlace, eventsAtPlace, peopleAtPlace } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { openNode } from '@/lib/navigation';
import type { Place } from '@/models';
import { distanceKm } from '@/services/mapProjection';
import { precisionColor, spacing } from '@/theme';

import { ConnectionCard } from './Cards';

/** Location information shown when a place is selected on the map. */
export function PlaceDetails({ place, compact }: { place: Place; compact?: boolean }) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const makkah = getPlace('makkah')?.coords;
  const km = makkah && place.coords && place.id !== 'makkah' ? Math.round(distanceKm(makkah, place.coords) / 5) * 5 : null;
  const events = eventsAtPlace(place.id);
  const people = peopleAtPlace(place.id).slice(0, compact ? 4 : 12);
  const episodes = episodesAtPlace(place.id);

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <AppText variant="title">{l(place.name)}</AppText>
          <AppText variant="small" color={c.accent} script="arabic">
            {place.arabicName}
          </AppText>
        </View>
        <BookmarkButton type="place" id={place.id} />
      </View>
      <View style={[styles.precision, { borderColor: precisionColor(c, place.precision) }]}>
        <AppText variant="tiny" color={precisionColor(c, place.precision)}>
          {t(`map.${place.precision}`)} – {t(`map.${place.precision}.desc`)}
        </AppText>
      </View>

      <AppText variant="label" muted>
        {t('map.whyItMatters')}
      </AppText>
      <AppText variant="body">{l(place.whyItMatters)}</AppText>

      <AppText variant="label" muted>
        {t('map.howKnown')}
      </AppText>
      <AppText variant="small">{l(place.locationNote)}</AppText>
      {km ? (
        <AppText variant="small" muted>
          {t('map.distance', { km })}
        </AppText>
      ) : null}

      {events.length ? (
        <>
          <AppText variant="label" muted>
            {t('map.events')}
          </AppText>
          {events.slice(0, compact ? 4 : 20).map((e) => (
            <ConnectionCard key={e.id} type="event" id={e.id} />
          ))}
        </>
      ) : null}
      {people.length ? (
        <>
          <AppText variant="label" muted>
            {t('map.people')}
          </AppText>
          {people.map((p) => (
            <ConnectionCard key={p.id} type="person" id={p.id} />
          ))}
        </>
      ) : null}
      {episodes.length ? (
        <>
          <AppText variant="label" muted>
            {t('map.episodes')}
          </AppText>
          {episodes.map((ep) => (
            <ConnectionCard key={ep.id} type="episode" id={ep.id} />
          ))}
        </>
      ) : null}
      {compact ? <Button label={t('map.openPlace')} variant="secondary" iconRight="chevron" onPress={() => openNode('place', place.id)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'flex-start' },
  precision: { borderLeftWidth: 3, paddingLeft: spacing.sm, paddingVertical: 2 },
});
