import { useMemo } from "react";
import {
  TMD_DATA,
  TMD_UNIQUE_VALUES,
  searchTmd,
  type TmdQuery,
} from "@/services/localData";
import type { TmdEntry } from "@/types";

/** Référentiel TMD ADR embarqué (aucun appel réseau). */
export function getTmdData(): TmdEntry[] {
  return TMD_DATA;
}

export interface TmdData {
  entries: TmdEntry[];
  onuValues: string[];
  descriptionValues: string[];
  dangerValues: string[];
  search: (query: TmdQuery) => TmdEntry[];
}

export function useTmd(): TmdData {
  return useMemo<TmdData>(
    () => ({
      entries: TMD_DATA,
      onuValues: TMD_UNIQUE_VALUES.onu,
      descriptionValues: TMD_UNIQUE_VALUES.description,
      dangerValues: TMD_UNIQUE_VALUES.danger,
      search: (query: TmdQuery) => searchTmd(query),
    }),
    [],
  );
}
