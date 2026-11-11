import { useMemo } from "react";
import {
  CATALOGS_DATA,
  HIGHWAYS_DATA,
  computeNetworkStats,
} from "@/services/localData";
import type { Highway, NetworkStats, PendingAxis } from "@/types";

/** Accès direct aux axes embarqués (aucun appel réseau). */
export function getHighways(): Highway[] {
  return HIGHWAYS_DATA;
}

/** Statistiques réseau calculées en mémoire à partir des axes locaux. */
export function getNetworkStats(highways: Highway[] = HIGHWAYS_DATA): NetworkStats {
  return computeNetworkStats(highways);
}

export interface HighwaysData {
  highways: Highway[];
  stats: NetworkStats;
  totalKm: number;
  landmarkCount: number;
  pendingAxes: PendingAxis[];
  highwayById: (id: string) => Highway | undefined;
}

export function useHighways(): HighwaysData {
  return useMemo<HighwaysData>(() => {
    const highways = getHighways();
    const stats = getNetworkStats(highways);
    return {
      highways,
      stats,
      totalKm: stats.totalKm,
      landmarkCount: stats.landmarks,
      pendingAxes: CATALOGS_DATA.pendingAxes.data,
      highwayById: (id: string) => highways.find((highway) => highway.id === id),
    };
  }, []);
}
