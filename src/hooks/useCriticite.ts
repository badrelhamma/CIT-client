import { useMemo } from "react";
import {
  CRITICITE_DATA,
  CRITICITE_LEVELS,
  getCriteria,
  getCriticiteData as getLocalCriticiteData,
} from "@/services/localData";
import type { CriticiteData, CriticiteLevelName } from "@/types";

/** Grille de criticité embarquée (aucun appel réseau). */
export function getCriticiteData(): CriticiteData {
  return getLocalCriticiteData();
}

export interface CriticiteCatalog {
  criticite: CriticiteData;
  levels: CriticiteLevelName[];
  criteria: Record<CriticiteLevelName, string[]>;
}

export function useCriticite(): CriticiteCatalog {
  return useMemo<CriticiteCatalog>(
    () => ({
      criticite: CRITICITE_DATA,
      levels: CRITICITE_LEVELS,
      criteria: {
        Courant: getCriteria("Courant"),
        Critique: getCriteria("Critique"),
        Majeur: getCriteria("Majeur"),
      },
    }),
    [],
  );
}
