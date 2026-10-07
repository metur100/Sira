import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HistoricalMap, type MapHandle } from '@/components/content/HistoricalMap';
import { PlaceDetails } from '@/components/content/PlaceDetails';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/Controls';
import { getPlace, PLACES, ROUTES } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useStatusBar } from '@/hooks/useStatusBar';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/appStore';
import { precisionColor, radius, spacing } from '@/theme';

export default function MapTab() {
  const { t, l } = useI18n();
  const { c } = useTheme();
  useStatusBar();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const params = useLocalSearchParams<{ place?: string }>();
  const discover = useAppStore((s) => s.discover);
  const [selectedId, setSelectedId] = useState<string | null>(params.place ?? null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [legend, setLegend] = useState(false);
  const mapRef = useRef<MapHandle>(null);
  const selected = selectedId ? getPlace(selectedId) : undefined;

  const select = (id: string, focus: boolean) => {
    setSelectedId(id);
    discover('place', [id]);
    if (focus) mapRef.current?.focus(id);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="title" accessibilityRole="header">
            {t('map.title')}
          </AppText>
          <AppText variant="tiny" muted numberOfLines={2}>
            {t('map.subtitle')}
          </AppText>
        </View>
        <IconButton icon="route" label={t('map.showRoutes')} onPress={() => setShowRoutes((v) => !v)} color={showRoutes ? c.accent : c.textMuted} />
        <IconButton icon="info" label={t('map.legend')} onPress={() => setLegend((v) => !v)} color={legend ? c.accent : c.textMuted} />
      </View>

      {legend ? (
        <View style={[styles.legend, { backgroundColor: c.surface, borderColor: c.border }]}>
          {(['historical', 'approximate', 'modern'] as const).map((p) => (
            <View key={p} style={styles.legendRow}>
              <View
                style={[
                  p === 'modern' ? styles.square : styles.dot,
                  { borderColor: precisionColor(c, p), backgroundColor: p === 'historical' ? precisionColor(c, p) : c.surface, borderStyle: p === 'approximate' ? 'dashed' : 'solid' },
                ]}
              />
              <AppText variant="tiny" style={styles.flex}>
                {t(`map.${p}`)} – {t(`map.${p}.desc`)}
              </AppText>
            </View>
          ))}
          <View style={styles.legendRow}>
            <View style={[styles.routeSample, { borderColor: c.accent }]} />
            <AppText variant="tiny" style={styles.flex}>
              {t('map.route')}
            </AppText>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.square, { backgroundColor: c.mapSea, borderColor: c.mapSea }]} />
            <AppText variant="tiny" style={styles.flex}>
              {t('map.coast')}
            </AppText>
          </View>
        </View>
      ) : null}

      <View style={styles.mapWrap}>
        <HistoricalMap ref={mapRef} places={PLACES} routes={ROUTES} selectedId={selectedId} onSelect={(id) => select(id, false)} height={Math.round(Math.max(320, windowHeight * 0.48))} showRoutes={showRoutes} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipRow}>
        {PLACES.filter((p) => p.coords).map((p) => (
          <FilterChip key={p.id} label={l(p.name)} icon="pin" selected={p.id === selectedId} onPress={() => select(p.id, true)} />
        ))}
      </ScrollView>

      <ScrollView style={styles.flex} contentContainerStyle={styles.details}>
        {selected ? (
          <PlaceDetails place={selected} compact />
        ) : (
          <AppText variant="small" muted>
            {t('episode.mapHint')}
          </AppText>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.xs },
  legend: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 3 },
  square: { width: 14, height: 14, borderWidth: 2 },
  routeSample: { width: 22, borderTopWidth: 2.5, borderStyle: 'dashed' },
  mapWrap: { paddingHorizontal: spacing.lg },
  chipRow: { flexGrow: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  details: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
});
