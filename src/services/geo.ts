import type { MapPoint } from "@/types";

export interface GeoPoint {
  lat: number;
  lon: number;
}

export function hasCoords(
  coords: MapPoint[] | null | undefined,
): coords is MapPoint[] {
  return Array.isArray(coords) && coords.length >= 2;
}

export function interpolateCoords(
  coords: MapPoint[] | null | undefined,
  pkMeters: number,
): GeoPoint | null {
  if (!hasCoords(coords)) return null;
  const sorted = [...coords].sort((a, b) => a.pk - b.pk);
  const pkKm = pkMeters / 1000;

  if (pkKm <= sorted[0].pk) {
    return { lat: sorted[0].lat, lon: sorted[0].lon };
  }
  const last = sorted[sorted.length - 1];
  if (pkKm >= last.pk) {
    return { lat: last.lat, lon: last.lon };
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (pkKm >= a.pk && pkKm <= b.pk) {
      const total = b.pk - a.pk;
      if (total === 0) return { lat: a.lat, lon: a.lon };
      const t = (pkKm - a.pk) / total;
      return {
        lat: a.lat + (b.lat - a.lat) * t,
        lon: a.lon + (b.lon - a.lon) * t,
      };
    }
  }
  return null;
}

export function googleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

export function unzoom(
  lat: number,
  radiusM: number,
): { latDelta: number; lonDelta: number } {
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos((lat * Math.PI) / 180);
  return {
    latDelta: radiusM / metersPerDegLat,
    lonDelta: metersPerDegLon === 0 ? 0 : radiusM / metersPerDegLon,
  };
}