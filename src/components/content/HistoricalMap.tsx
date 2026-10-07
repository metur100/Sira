import { type Ref, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { type GestureResponderEvent, type LayoutChangeEvent, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/Button';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { Place, Route } from '@/models';
import { COASTLINE, MAP_ASPECT, MAP_BOUNDS, project } from '@/services/mapProjection';
import { fonts, precisionColor, radius, spacing } from '@/theme';

/** Places in priority order; lower-priority markers hide when they would overlap at the current zoom. */
const PRIORITY = ['makkah', 'madinah', 'taif', 'badr', 'hudaybiyyah', 'uhud', 'quba', 'hira', 'thawr', 'arafat', 'jeddah'];
const MAX_SCALE = 8;

interface View3 {
  s: number;
  tx: number;
  ty: number;
}

export interface MapHandle {
  /** Centres and zooms the map on a place. */
  focus: (placeId: string, scale?: number) => void;
}

interface HistoricalMapProps {
  ref?: Ref<MapHandle>;
  places: readonly Place[];
  routes: readonly Route[];
  selectedId?: string | null;
  onSelect?: (placeId: string) => void;
  height: number;
  showRoutes?: boolean;
  /** Open zoomed to the given places instead of the whole region. */
  fitToPlaces?: boolean;
  /** Lets a parent ScrollView pause scrolling while the map is being dragged. */
  onInteraction?: (active: boolean) => void;
}

const canvas = (w: number) => ({ W: w, H: w / MAP_ASPECT });

/** Keeps the map inside the viewport and the zoom between "whole region" and MAX_SCALE. */
function clamp(v: View3, w: number, h: number): View3 {
  const { W, H } = canvas(w);
  const minS = Math.min(1, h / H);
  const s = Math.min(MAX_SCALE, Math.max(minS, v.s));
  const cw = W * s;
  const ch = H * s;
  const tx = cw <= w ? (w - cw) / 2 : Math.min(0, Math.max(w - cw, v.tx));
  const ty = ch <= h ? (h - ch) / 2 : Math.min(0, Math.max(h - ch, v.ty));
  return { s, tx, ty };
}

function touchesInfo(e: GestureResponderEvent) {
  const touches = e.nativeEvent.touches;
  if (touches.length < 2) return null;
  const [a, b] = touches;
  return {
    dist: Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY),
    midX: (a.locationX + b.locationX) / 2,
    midY: (a.locationY + b.locationY) / 2,
  };
}

export function HistoricalMap({ ref, places, routes, selectedId, onSelect, height, showRoutes = true, onInteraction, fitToPlaces }: HistoricalMapProps) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const [size, setSize] = useState({ w: 0, h: height });
  const [view, setView] = useState<View3>({ s: 1, tx: 0, ty: 0 });

  /*
   * Gesture engine: created once. Its mutable "box" holds the latest view, size and gesture start,
   * and is only read or written inside event handlers – never during render.
   */
  const [engine] = useState(() => {
    const box = {
      view: { s: 1, tx: 0, ty: 0 } as View3,
      size: { w: 0, h: height },
      start: { s: 1, tx: 0, ty: 0, dist: 0, midX: 0, midY: 0, pinching: false },
      onInteraction: undefined as ((active: boolean) => void) | undefined,
    };
    const apply = (v: View3) => {
      const next = clamp(v, box.size.w, box.size.h);
      box.view = next;
      setView(next);
    };
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length > 1,
      onMoveShouldSetPanResponder: (e, g) => e.nativeEvent.touches.length > 1 || Math.abs(g.dx) + Math.abs(g.dy) > 6,
      onPanResponderGrant: (e) => {
        box.onInteraction?.(true);
        const info = touchesInfo(e);
        box.start = { ...box.view, dist: info?.dist ?? 0, midX: info?.midX ?? 0, midY: info?.midY ?? 0, pinching: !!info };
      },
      onPanResponderMove: (e, g) => {
        const start = box.start;
        const info = touchesInfo(e);
        if (info) {
          if (!start.pinching) {
            box.start = { ...box.view, dist: info.dist, midX: info.midX, midY: info.midY, pinching: true };
            return;
          }
          const s = start.s * (info.dist / Math.max(1, start.dist));
          const ratio = s / start.s;
          apply({ s, tx: start.midX - (start.midX - start.tx) * ratio, ty: start.midY - (start.midY - start.ty) * ratio });
        } else if (!start.pinching) {
          apply({ s: start.s, tx: start.tx + g.dx, ty: start.ty + g.dy });
        }
      },
      onPanResponderRelease: () => box.onInteraction?.(false),
      onPanResponderTerminate: () => box.onInteraction?.(false),
      onPanResponderTerminationRequest: () => false,
    });
    const zoom = (factor: number) => {
      const v = box.view;
      const { w, h } = box.size;
      const s = v.s * factor;
      const ratio = s / v.s;
      apply({ s, tx: w / 2 - (w / 2 - v.tx) * ratio, ty: h / 2 - (h / 2 - v.ty) * ratio });
    };
    const layout = (w: number, h: number, fit: { lat: number; lon: number }[]) => {
      box.size = { w, h };
      if (fit.length === 0) {
        apply({ s: 0, tx: 0, ty: 0 }); // start with the whole region visible
        return;
      }
      const dims = canvas(w);
      const pts = fit.map((p) => project(p, dims.W, dims.H));
      const minX = Math.min(...pts.map((p) => p.x));
      const maxX = Math.max(...pts.map((p) => p.x));
      const minY = Math.min(...pts.map((p) => p.y));
      const maxY = Math.max(...pts.map((p) => p.y));
      const pad = 90;
      const scale = Math.min(3, (w - pad) / Math.max(1, maxX - minX), (h - pad) / Math.max(1, maxY - minY));
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      apply({ s: scale, tx: w / 2 - cx * scale, ty: h / 2 - cy * scale });
    };
    const focus = (coords: { lat: number; lon: number }, scale: number) => {
      const { w, h } = box.size;
      const dims = canvas(w);
      const q = project(coords, dims.W, dims.H);
      apply({ s: scale, tx: w / 2 - q.x * scale, ty: h / 2 - q.y * scale });
    };
    const setInteraction = (fn: ((active: boolean) => void) | undefined) => {
      box.onInteraction = fn;
    };
    return { responder, zoom, layout, focus, reset: () => apply({ s: 0, tx: 0, ty: 0 }), setInteraction };
  });

  useEffect(() => {
    engine.setInteraction(onInteraction);
  }, [engine, onInteraction]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    setSize({ w: width, h });
    engine.layout(width, h, fitToPlaces ? places.flatMap((p) => (p.coords ? [p.coords] : [])) : []);
  };

  useImperativeHandle(
    ref,
    () => ({
      focus: (placeId, scale = 5) => {
        const place = places.find((p) => p.id === placeId);
        if (place?.coords) engine.focus(place.coords, scale);
      },
    }),
    [places, engine],
  );

  const responder = engine.responder;
  const zoom = engine.zoom;
  const { W, H } = canvas(size.w || 1);
  // Decide which markers fit without overlapping at this zoom level.
  const visible = useMemo(() => {
    const ordered = [...places].filter((p) => p.coords).sort((a, b) => {
      const ia = PRIORITY.indexOf(a.id);
      const ib = PRIORITY.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    // Each marker occupies its dot plus the label to its right; markers whose box would overlap
    // a more important one are hidden until the reader zooms in.
    const box = (x: number, y: number, name: string) => ({ x1: x - 12, y1: y - 14, x2: x + 26 + name.length * 7.2, y2: y + 14 });
    const shown: { place: Place; x: number; y: number; b: ReturnType<typeof box> }[] = [];
    for (const place of ordered) {
      const p = project(place.coords!, W, H);
      const x = p.x * view.s + view.tx;
      const y = p.y * view.s + view.ty;
      const b = box(x, y, l(place.name));
      const forced = place.id === selectedId;
      const clash = shown.some((o) => o.b.x1 < b.x2 && b.x1 < o.b.x2 && o.b.y1 < b.y2 && b.y1 < o.b.y2);
      if (forced || !clash) shown.push({ place, x, y, b });
    }
    return shown;
  }, [places, W, H, view, selectedId, l]);

  const seaPath = useMemo(() => {
    const pts = COASTLINE.map((pt) => project(pt, W, H));
    const first = pts[0];
    const last = pts[pts.length - 1];
    // Extended well beyond the canvas so the area outside the bounds is never shown as land.
    return `M${-3 * W} ${-2 * H} L${first.x} ${-2 * H} L${pts.map((p) => `${p.x} ${p.y}`).join(' L')} L${last.x} ${3 * H} L${-3 * W} ${3 * H} Z`;
  }, [W, H]);

  const grid = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let lat = Math.ceil(MAP_BOUNDS.south); lat <= MAP_BOUNDS.north; lat++) {
      const a = project({ lat, lon: MAP_BOUNDS.west }, W, H);
      lines.push({ x1: 0, y1: a.y, x2: W, y2: a.y });
    }
    for (let lon = Math.ceil(MAP_BOUNDS.west); lon <= MAP_BOUNDS.east; lon++) {
      const a = project({ lat: MAP_BOUNDS.north, lon }, W, H);
      lines.push({ x1: a.x, y1: 0, x2: a.x, y2: H });
    }
    return lines;
  }, [W, H]);

  const offMap = places.filter((p) => !p.coords);
  const sea = project({ lat: 22.6, lon: 38.35 }, W, H);

  return (
    <View style={[styles.root, { height, borderColor: c.border, backgroundColor: c.mapLand }]} onLayout={onLayout} accessibilityLabel={t('map.label', { count: visible.length })}>
      <View style={StyleSheet.absoluteFill} {...responder.panHandlers}>
        {size.w > 0 ? (
          <Svg width={size.w} height={size.h}>
            <G transform={`translate(${view.tx} ${view.ty}) scale(${view.s})`}>
              <Rect x={-3 * W} y={-2 * H} width={7 * W} height={5 * H} fill={c.mapLand} />
              <Path d={seaPath} fill={c.mapSea} />
              {grid.map((g, i) => (
                <Line key={i} {...g} stroke={c.mapLine} strokeWidth={0.6 / view.s} opacity={0.35} strokeDasharray={`${4 / view.s} ${4 / view.s}`} />
              ))}
              <SvgText
                x={sea.x}
                y={sea.y}
                fontSize={13 / view.s}
                fontFamily={fonts.serif}
                fill={c.textMuted}
                opacity={0.8}
                transform={`rotate(-62 ${sea.x} ${sea.y})`}
                textAnchor="middle"
              >
                {t('map.coast').split(' – ')[0]}
              </SvgText>
              {showRoutes
                ? routes.map((r) => {
                    const d = r.points
                      .map((p, i) => {
                        const q = project(p, W, H);
                        return `${i === 0 ? 'M' : 'L'}${q.x} ${q.y}`;
                      })
                      .join(' ');
                    return (
                      <Path
                        key={r.id}
                        d={d}
                        stroke={c.accent}
                        strokeWidth={2.4 / view.s}
                        strokeDasharray={`${7 / view.s} ${5 / view.s}`}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity={0.9}
                      />
                    );
                  })
                : null}
            </G>
          </Svg>
        ) : null}
        {visible.map(({ place, x, y }) => {
          const selected = place.id === selectedId;
          const color = precisionColor(c, place.precision);
          const precisionLabel = t(`map.${place.precision}`);
          return (
            <Pressable
              key={place.id}
              onPress={() => onSelect?.(place.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={t('a11y.marker', { name: l(place.name), precision: precisionLabel })}
              hitSlop={8}
              style={[styles.marker, { left: x - 14, top: y - 14 }]}
            >
              {/* MapLocation marker: solid = historical, dashed ring = approximate, square = modern reference */}
              <View
                style={[
                  place.precision === 'modern' ? styles.modernDot : styles.dot,
                  {
                    borderColor: selected ? c.gold : color,
                    backgroundColor: place.precision === 'historical' ? color : c.surface,
                    borderStyle: place.precision === 'approximate' ? 'dashed' : 'solid',
                    transform: [{ scale: selected ? 1.25 : 1 }],
                  },
                ]}
              />
              <View style={[styles.label, { backgroundColor: c.surface, borderColor: selected ? c.gold : c.border }]}>
                <AppText variant="tiny" color={place.precision === 'modern' ? c.textMuted : c.text} numberOfLines={1}>
                  {l(place.name)}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.controls, { backgroundColor: c.surface, borderColor: c.border }]}>
        <IconButton icon="plus" label={t('map.zoomIn')} onPress={() => zoom(1.6)} size={20} />
        <IconButton icon="minus" label={t('map.zoomOut')} onPress={() => zoom(1 / 1.6)} size={20} />
        <IconButton icon="locate" label={t('map.reset')} onPress={engine.reset} size={20} />
      </View>

      {offMap.length ? (
        <View style={[styles.offMap, { backgroundColor: c.surface, borderColor: c.border }]}>
          <AppText variant="tiny" muted>
            ↙ {t('map.offMap', { place: offMap.map((p) => l(p.name)).join(', ') })}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  marker: { position: 'absolute', flexDirection: 'row', alignItems: 'center', minHeight: 28 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, marginLeft: 5 },
  modernDot: { width: 12, height: 12, borderWidth: 2, marginLeft: 8 },
  label: { marginLeft: 6, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 1, maxWidth: 150 },
  controls: { position: 'absolute', right: spacing.sm, top: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  offMap: { position: 'absolute', left: spacing.sm, top: spacing.sm, borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, maxWidth: '70%' },
});
