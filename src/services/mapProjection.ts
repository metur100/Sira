import type { Coordinates } from '@/models';

/**
 * Simple equirectangular projection of the Hijaz onto the map canvas. Good enough for orientation
 * at this scale; the map never claims survey precision.
 */
export const MAP_BOUNDS = { north: 24.95, south: 20.85, west: 38.2, east: 41.0 } as const;

/** Width/height ratio of the bounds, corrected for latitude so distances look right. */
export const MAP_ASPECT =
  ((MAP_BOUNDS.east - MAP_BOUNDS.west) * Math.cos((((MAP_BOUNDS.north + MAP_BOUNDS.south) / 2) * Math.PI) / 180)) /
  (MAP_BOUNDS.north - MAP_BOUNDS.south);

export function project(coords: Coordinates, width: number, height: number): { x: number; y: number } {
  return {
    x: ((coords.lon - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * width,
    y: ((MAP_BOUNDS.north - coords.lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * height,
  };
}

/** Great-circle distance in km (used to show approximate modern distances). */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * A rough outline of the Red Sea coast of the Hijaz (modern coastline, approximate),
 * drawn only for orientation.
 */
export const COASTLINE: readonly Coordinates[] = [
  { lat: 24.95, lon: 37.95 },
  { lat: 24.1, lon: 38.05 },
  { lat: 23.6, lon: 38.55 },
  { lat: 22.9, lon: 38.9 },
  { lat: 22.3, lon: 39.08 },
  { lat: 21.5, lon: 39.15 },
  { lat: 20.85, lon: 39.4 },
];
