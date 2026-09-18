import type { Highway, Landmark } from "@/types";

export type Side = "egal" | "avant" | "après";

export interface LocationResult {
  previous: Landmark | null;
  next: Landmark | null;
  nearest: Landmark;
  distanceM: number;
  side: Side;
  distanceLabel: string;
  destination: string;
}

export interface RandomPkOptions {
  marginM?: number;
  random?: () => number;
}

export function parsePk(input: string, highway: Highway): number | null {
  const raw = input.trim();
  if (!raw) return null;

  let meters: number | null = null;

  if (raw.includes("+")) {
    const [km, m] = raw.split("+");
    const kmN = Number(km.trim().replace(",", "."));
    const mN = Number(m.trim().replace(",", "."));
    if (!Number.isFinite(kmN) || !Number.isFinite(mN)) return null;
    meters = Math.round(kmN * 1000 + mN);
  } else if (raw.includes(".") || raw.includes(",")) {
    const kmN = Number(raw.replace(",", "."));
    if (!Number.isFinite(kmN)) return null;
    meters = Math.round(kmN * 1000);
  } else if (/^\d+$/.test(raw)) {
    const value = Number(raw);
    if (raw.length >= 5) {
      meters = value;
    } else {
      meters = value * 1000;
    }
  } else {
    return null;
  }

  const max = Math.round(highway.lengthKm * 1000);
  if (meters < 0 || meters > max) return null;
  return meters;
}

export function formatPk(pk: number): string {
  const km = Math.floor(pk / 1000);
  const meters = pk % 1000;
  return `${km}+${String(meters).padStart(3, "0")}`;
}

export function formatPkKm(pk: number): string {
  return String(Math.floor(pk / 1000));
}

export function formatDistance(m: number): string {
  if (m >= 950) {
    const km = Math.round(m / 1000);
    return `${String(km).padStart(2, "0")} km`;
  }
  const rounded = Math.max(10, Math.round(m / 10) * 10);
  return `${rounded} m`;
}

export function findNearestLocation(
  highway: Highway,
  pk: number,
  direction: string,
): LocationResult | null {
  if (!Array.isArray(highway.landmarks) || highway.landmarks.length === 0) {
    return null;
  }

  const sorted = [...highway.landmarks].sort((a, b) => a.pk - b.pk);

  let previous: Landmark | null = null;
  let next: Landmark | null = null;
  let best: Landmark = sorted[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const landmark of sorted) {
    if (landmark.pk <= pk) previous = landmark;
    if (landmark.pk > pk && next === null) next = landmark;

    const distance = Math.abs(pk - landmark.pk);
    if (distance < bestDistance) {
      best = landmark;
      bestDistance = distance;
    }
  }

  let distanceM = bestDistance;
  if (distanceM < 25) distanceM = Math.abs(pk - best.pk);

  let side: Side;
  if (distanceM < 25) {
    side = "egal";
  } else if (direction === highway.dirB) {
    side = best.pk > pk ? "avant" : "après";
  } else {
    side = best.pk < pk ? "avant" : "après";
  }

  let destination = highway.origin;
  if (direction === highway.dirB) destination = highway.end;
  else if (direction === highway.dirA) destination = highway.origin;

  return {
    previous,
    next,
    nearest: best,
    distanceM,
    side,
    distanceLabel: formatDistance(distanceM),
    destination,
  };
}

export function locationLabel(
  highway: Highway,
  pk: number,
  direction: string,
): string | null {
  const result = findNearestLocation(highway, pk, direction);
  if (!result) return null;
  if (result.side === "egal") return `À hauteur de ${result.nearest.name}`;
  return `${result.distanceLabel} ${result.side} ${result.nearest.name}`;
}

export function randomPk(
  highway: Highway,
  options: RandomPkOptions = {},
): number | null {
  if (!Array.isArray(highway.landmarks) || highway.landmarks.length === 0) {
    return null;
  }
  const margin = options.marginM ?? 900;
  const rnd = options.random ?? Math.random;
  const landmark = highway.landmarks[Math.floor(rnd() * highway.landmarks.length)];
  const offset = Math.round((rnd() * 2 - 1) * margin);
  const max = Math.round(highway.lengthKm * 1000);
  return Math.min(max, Math.max(0, landmark.pk + offset));
}