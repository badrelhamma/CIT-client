import catalogsSource from "@/data/catalogs.json";
import criticiteSource from "@/data/criticite.json";
import directorySource from "@/data/DIR_STABLE_DATA.json";
import highwaysSource from "@/data/highways.json";
import tmdSource from "@/data/tmd.json";
import type {
  CatalogEntry,
  Catalogs,
  CriticiteData,
  CriticiteLevelName,
  DirectoryEntry,
  Highway,
  NetworkStats,
  TmdEntry,
} from "@/types";

/** Version des référentiels embarqués dans le bundle (alignée sur le serveur). */
export const LOCAL_DATA_VERSION = "2026-01";

const LOCAL_SEEDED_AT = "";

function catalogEntry<T>(data: T): CatalogEntry<T> {
  return { version: LOCAL_DATA_VERSION, data, seededAt: LOCAL_SEEDED_AT };
}

type CatalogData = { [K in keyof Catalogs]: Catalogs[K]["data"] };

const rawCatalogs = catalogsSource as unknown as CatalogData;

export const HIGHWAYS_DATA: Highway[] = highwaysSource as unknown as Highway[];
export const DIRECTORY_DATA: DirectoryEntry[] =
  directorySource as unknown as DirectoryEntry[];
export const TMD_DATA: TmdEntry[] = tmdSource as unknown as TmdEntry[];
export const CRITICITE_DATA: CriticiteData =
  criticiteSource as unknown as CriticiteData;

export const CRITICITE_LEVELS: CriticiteLevelName[] = [
  "Courant",
  "Critique",
  "Majeur",
];

/** Longueur cumulée et nombre total de repères, calculés en mémoire. */
export function computeNetworkStats(
  highways: Highway[] = HIGHWAYS_DATA,
  pendingCount: number = rawCatalogs.pendingAxes.length,
): NetworkStats {
  const totalKm = highways.reduce(
    (sum, highway) => sum + (Number(highway.lengthKm) || 0),
    0,
  );
  const landmarks = highways.reduce(
    (sum, highway) => sum + (highway.landmarks?.length ?? 0),
    0,
  );
  return {
    highways: highways.length,
    pending: pendingCount,
    totalKm: Math.round(totalKm * 10) / 10,
    landmarks,
  };
}

export const NETWORK_STATS: NetworkStats = computeNetworkStats();

export const CATALOGS_DATA: Catalogs = {
  lanes: catalogEntry(rawCatalogs.lanes),
  trafficImpacts: catalogEntry(rawCatalogs.trafficImpacts),
  damageTypes: catalogEntry(rawCatalogs.damageTypes),
  actionActors: catalogEntry(rawCatalogs.actionActors),
  actionStatuses: catalogEntry(rawCatalogs.actionStatuses),
  vehicleTypes: catalogEntry(rawCatalogs.vehicleTypes),
  maxVehicleChoices: catalogEntry(rawCatalogs.maxVehicleChoices),
  countValues: catalogEntry(rawCatalogs.countValues),
  bilanTypeTemplates: catalogEntry(rawCatalogs.bilanTypeTemplates),
  eventColors: catalogEntry(rawCatalogs.eventColors),
  requestTypes: catalogEntry(rawCatalogs.requestTypes),
  detectionSources: catalogEntry(rawCatalogs.detectionSources),
  statuses: catalogEntry(rawCatalogs.statuses),
  landmarkTypeMeta: catalogEntry(rawCatalogs.landmarkTypeMeta),
  pendingAxes: catalogEntry(rawCatalogs.pendingAxes),
  networkStats: catalogEntry(NETWORK_STATS),
};

export function normalizeSearchText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function metierKey(value: unknown): string {
  return normalizeSearchText(value).replace(/[.,;:]+$/g, "");
}

export interface DirectoryFilters {
  q?: string;
  metier?: string;
  region?: string;
  axe?: string;
  pk?: string | number | null;
}

export function matchesDirectoryZone(
  item: DirectoryEntry,
  axe: string,
  pkText: string,
): boolean {
  const zones = item.zones ?? [];
  if (!axe && !pkText) return true;
  const pk = pkText === "" ? null : Number(pkText);
  return zones.some((zone) => {
    if (axe && zone.axe !== axe) return false;
    if (pk === null) return true;
    if (Number.isNaN(pk) || Number.isNaN(zone.pkd) || Number.isNaN(zone.pkf)) {
      return false;
    }
    return (
      pk >= Math.min(zone.pkd, zone.pkf) && pk <= Math.max(zone.pkd, zone.pkf)
    );
  });
}

/** Recherche instantanée par texte libre, métier, région, axe et PK. */
export function searchDirectory(
  filters: DirectoryFilters = {},
  entries: DirectoryEntry[] = DIRECTORY_DATA,
): DirectoryEntry[] {
  const needle = normalizeSearchText(filters.q);
  const metier = metierKey(filters.metier);
  const region = String(filters.region ?? "").trim();
  const axe = String(filters.axe ?? "").trim();
  const pkText =
    filters.pk === null || filters.pk === undefined
      ? ""
      : String(filters.pk).trim();

  return entries.filter((item) => {
    if (region && item.region !== region) return false;
    if (metier && metierKey(item.metier) !== metier) return false;
    if (!matchesDirectoryZone(item, axe, pkText)) return false;
    if (!needle) return true;
    const zoneText = (item.zones ?? [])
      .map((zone) => [zone.axe, zone.pkd, zone.pkf].join(" "))
      .join(" ");
    const haystack = normalizeSearchText(
      [
        item.region,
        item.nom,
        item.telephone,
        item.metier,
        item.troncon,
        zoneText,
      ].join(" "),
    );
    return haystack.includes(needle);
  });
}

export function getDirectoryMetiers(
  entries: DirectoryEntry[] = DIRECTORY_DATA,
): string[] {
  const map = new Map<string, string>();
  for (const item of entries) {
    const key = metierKey(item.metier);
    if (!key) continue;
    const label = item.metier.trim();
    if (!map.has(key) || label.length < (map.get(key) ?? "").length) {
      map.set(key, label.replace(/,$/, "") || label);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "fr"));
}

export function getDirectoryRegions(
  highways: Highway[] = HIGHWAYS_DATA,
): string[] {
  const regions = new Set<string>();
  for (const highway of highways) {
    for (const zone of highway.zones ?? []) {
      if (zone.region) regions.add(zone.region);
    }
  }
  return Array.from(regions).sort((a, b) => a.localeCompare(b, "fr"));
}

export function getDirectoryZones(highways: Highway[] = HIGHWAYS_DATA) {
  return highways.flatMap((highway) =>
    (highway.zones ?? []).map((zone) => ({ axe: highway.id, ...zone })),
  );
}

export interface TmdQuery {
  onu?: string;
  description?: string;
  danger?: string;
}

/** Filtre local des matières dangereuses sur les 3 champs ADR. */
export function searchTmd(
  query: TmdQuery,
  entries: TmdEntry[] = TMD_DATA,
): TmdEntry[] {
  const onu = normalizeSearchText(query.onu);
  const description = normalizeSearchText(query.description);
  const danger = normalizeSearchText(query.danger);
  if (!onu && !description && !danger) return entries;
  return entries.filter(
    (entry) =>
      (!onu || normalizeSearchText(entry.onu).includes(onu)) &&
      (!description ||
        normalizeSearchText(entry.description).includes(description)) &&
      (!danger || normalizeSearchText(entry.danger).includes(danger)),
  );
}

function uniqueTmdValues(key: keyof TmdEntry): string[] {
  return Array.from(
    new Set(
      TMD_DATA.map((entry) => String(entry[key] ?? "").trim()).filter(Boolean),
    ),
  ).sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }),
  );
}

export const TMD_UNIQUE_VALUES: Record<keyof TmdEntry, string[]> = {
  onu: uniqueTmdValues("onu"),
  description: uniqueTmdValues("description"),
  danger: uniqueTmdValues("danger"),
};

export function getCriticiteData(): CriticiteData {
  return CRITICITE_DATA;
}

export function getCriteria(level: CriticiteLevelName): string[] {
  return CRITICITE_DATA[level] ?? [];
}
