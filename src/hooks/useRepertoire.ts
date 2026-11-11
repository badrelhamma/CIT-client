import { useMemo } from "react";
import {
  DIRECTORY_DATA,
  HIGHWAYS_DATA,
  getDirectoryMetiers,
  getDirectoryRegions,
  getDirectoryZones,
  metierKey,
  searchDirectory,
  type DirectoryFilters,
} from "@/services/localData";
import type { DirectoryEntry } from "@/types";

/** Contacts d'urgence embarqués (aucun appel réseau). */
export function getContacts(): DirectoryEntry[] {
  return DIRECTORY_DATA;
}

export interface RepertoireZone {
  axe: string;
  region: string;
  pkd: number;
  pkf: number;
}

export interface RepertoireData {
  contacts: DirectoryEntry[];
  filtered: DirectoryEntry[];
  metiers: string[];
  zones: RepertoireZone[];
  regions: string[];
  regionAxes: string[];
  currentZone: RepertoireZone | null;
}

export function useRepertoire(filters: DirectoryFilters = {}): RepertoireData {
  const { q, metier, region, axe, pk } = filters;

  return useMemo<RepertoireData>(() => {
    const contacts = getContacts();
    const zones = getDirectoryZones(HIGHWAYS_DATA);
    const metiers = getDirectoryMetiers(contacts);
    const regions = getDirectoryRegions(HIGHWAYS_DATA);

    const regionAxes = Array.from(
      new Set(
        (region
          ? zones.filter((zone) => zone.region === region)
          : zones
        ).map((zone) => zone.axe),
      ),
    ).sort((a, b) => a.localeCompare(b, "fr"));

    const currentZone =
      zones.find(
        (zone) =>
          zone.axe === axe && (!region || zone.region === region),
      ) ?? null;

    const filtered = searchDirectory({ q, metier, region, axe, pk }, contacts);

    return {
      contacts,
      filtered,
      metiers,
      zones,
      regions,
      regionAxes,
      currentZone,
    };
  }, [q, metier, region, axe, pk]);
}

export { metierKey };
