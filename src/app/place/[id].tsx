import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BlockView, SourceCard } from '@/components/content/Blocks';
import { HistoricalMap } from '@/components/content/HistoricalMap';
import { PlaceDetails } from '@/components/content/PlaceDetails';
import { Button } from '@/components/ui/Button';
import { EmptyState, Screen, SectionTitle, TopBar } from '@/components/ui/Layout';
import { getPlace, getSource, PLACES, resolve } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { openConnections } from '@/lib/navigation';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme';

export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const place = getPlace(String(id));
  const discover = useAppStore((s) => s.discover);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  useEffect(() => {
    if (place) discover('place', [place.id]);
  }, [place, discover]);

  if (!place) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="pin" title={t('place.notFound')} actionLabel={t('common.back')} onAction={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen header={<TopBar title={t('type.place')} />} scrollEnabled={scrollEnabled}>
      {place.coords ? <HistoricalMap places={PLACES.filter((p) => p.coords)} routes={[]} selectedId={place.id} height={220} showRoutes={false} onInteraction={(active) => setScrollEnabled(!active)} onSelect={(pid) => pid !== place.id && router.replace({ pathname: '/place/[id]', params: { id: pid } })} /> : null}
      <PlaceDetails place={place} />
      <SectionTitle title={t('place.description')} />
      {place.description.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
      <Button label={t('connections.title')} variant="secondary" icon="link" onPress={() => openConnections('place', place.id)} />
      {place.sourceIds.length ? (
        <View style={styles.section}>
          <SectionTitle title={t('event.sources')} />
          {resolve(place.sourceIds, getSource).map((s) => (
            <SourceCard key={s.id} source={s} compact />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
});
