import { useEffect, useMemo, useRef, useState } from "react";
import { composeBilanType } from "@/services/bilan";
import type { BilanSuffix, BilanVictimes } from "@/services/message";
import type { BilanData, BilanTypeDef, Catalogs } from "@/types";

/**
 * État + dérivations partagés des champs « Bilan / Mise à jour »
 * (gabarit, véhicules, voies, impact, dégâts, victimes, intervenants).
 * Toutes les options proviennent des référentiels exposés par data/fields.
 */
export function useBilanOptions(catalogs: Catalogs | null) {
  const [bilanType, setBilanType] = useState<BilanTypeDef | null>(null);
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [customText, setCustomText] = useState("");
  const [laneIds, setLaneIds] = useState<string[]>([]);
  const [impactId, setImpactId] = useState("");
  const [bouchonMeters, setBouchonMeters] = useState("");
  const [damageIds, setDamageIds] = useState<string[]>([]);
  const [victimes, setVictimes] = useState<BilanVictimes>({
    bl: 0,
    bg: 0,
    tues: 0,
  });
  const [actorIds, setActorIds] = useState<string[]>([]);
  const [actionStatusId, setActionStatusId] = useState("");
  const prefilledRef = useRef(false);

  /* Pré-remplissage des référentiels dès leur chargement (valeurs par défaut
     alignées sur le référentiel exposé par data/fields du serveur). */
  useEffect(() => {
    if (!catalogs || prefilledRef.current) return;
    prefilledRef.current = true;
    setBilanType(catalogs.bilanTypeTemplates.data[0] ?? null);
    setCount(2);
    const hasBau = catalogs.lanes.data.some((l) => l.id === "bau");
    setLaneIds(hasBau ? ["bau"] : []);
    setImpactId(catalogs.trafficImpacts.data[0]?.id ?? "");
    const firstActor = catalogs.actionActors.data[0]?.id;
    setActorIds(firstActor ? [firstActor] : []);
    setActionStatusId(catalogs.actionStatuses.data[0]?.id ?? "sur-place");
  }, [catalogs]);

  function toggleId(
    list: string[],
    setter: (next: string[]) => void,
  ): (id: string) => void {
    return (id) =>
      setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  const bilanLabel = useMemo(() => {
    if (!bilanType) return "";
    if (bilanType.isCustom) return customText.trim();
    return composeBilanType(bilanType.template, vehicles, count ?? 1);
  }, [bilanType, vehicles, count, customText]);

  const hasCorporel = damageIds.includes("corporel");

  const vehiclesRequired = bilanType?.hasVehicle ?? false;
  const vehiclesMissing = vehiclesRequired && vehicles.length === 0;

  const impactLabel = useMemo(() => {
    if (!impactId) return "";
    return (
      catalogs?.trafficImpacts.data.find((i) => i.id === impactId)?.label ?? ""
    );
  }, [impactId, catalogs]);

  const trafficJamMeters =
    impactId === "bouchon" ? Number.parseInt(bouchonMeters, 10) || 0 : 0;

  const laneLabels = useMemo(
    () =>
      laneIds.map((id) => catalogs?.lanes.data.find((l) => l.id === id)?.label ?? id),
    [laneIds, catalogs],
  );

  const damageLabels = useMemo(
    () =>
      damageIds.map(
        (id) =>
          catalogs?.damageTypes.data.find((d) => d.id === id)?.label ?? id,
      ),
    [damageIds, catalogs],
  );

  const actorLabels = useMemo(
    () =>
      actorIds.map(
        (id) =>
          catalogs?.actionActors.data.find((a) => a.id === id)?.label ?? id,
      ),
    [actorIds, catalogs],
  );

  const actionStatusLabel = useMemo(() => {
    if (!actionStatusId) return "";
    return (
      catalogs?.actionStatuses.data.find((s) => s.id === actionStatusId)?.label ??
      ""
    );
  }, [actionStatusId, catalogs]);

  const suffix: BilanSuffix = useMemo(
    () => ({
      laneLabel: laneLabels.length > 0 ? laneLabels.join(", ") : "—",
      impactLabel: impactLabel || "—",
      trafficJamMeters: trafficJamMeters > 0 ? trafficJamMeters : null,
      damageLabels,
      victimes: hasCorporel ? victimes : null,
      actorLabels,
      actionStatusLabel,
    }),
    [
      laneLabels,
      impactLabel,
      trafficJamMeters,
      damageLabels,
      hasCorporel,
      victimes,
      actorLabels,
      actionStatusLabel,
    ],
  );

  function reset() {
    setBilanType(null);
    setVehicles([]);
    setCount(null);
    setCustomText("");
    setLaneIds([]);
    setImpactId("");
    setBouchonMeters("");
    setDamageIds([]);
    setVictimes({ bl: 0, bg: 0, tues: 0 });
    setActorIds([]);
    setActionStatusId("");
  }

  return {
    bilanType,
    setBilanType,
    vehicles,
    setVehicles,
    toggleVehicle: toggleId(vehicles, setVehicles),
    vehiclesRequired,
    vehiclesMissing,
    count,
    setCount,
    customText,
    setCustomText,
    laneIds,
    toggleLane: toggleId(laneIds, setLaneIds),
    impactId,
    setImpactId,
    bouchonMeters,
    setBouchonMeters,
    damageIds,
    toggleDamage: toggleId(damageIds, setDamageIds),
    victimes,
    setVictimes,
    hasCorporel,
    actorIds,
    toggleActor: toggleId(actorIds, setActorIds),
    actionStatusId,
    setActionStatusId,
    bilanLabel,
    laneLabels,
    damageLabels,
    actorLabels,
    impactLabel,
    trafficJamMeters,
    actionStatusLabel,
    suffix,
    reset,
    bilanTypeTemplates: catalogs?.bilanTypeTemplates.data ?? [],
    vehicleTypes: catalogs?.vehicleTypes.data ?? [],
    maxVehicles: catalogs?.maxVehicleChoices.data ?? 3,
    countValues: catalogs?.countValues.data ?? [],
    lanes: catalogs?.lanes.data ?? [],
    trafficImpacts: catalogs?.trafficImpacts.data ?? [],
    damageTypes: catalogs?.damageTypes.data ?? [],
    actionActors: catalogs?.actionActors.data ?? [],
    actionStatuses: catalogs?.actionStatuses.data ?? [],
  };
}

export type BilanOptionsApi = ReturnType<typeof useBilanOptions>;

/** Convertit l'état du bilan en données structurées stockées sur l'événement. */
export function toBilanData(opts: BilanOptionsApi): BilanData {
  return {
    label: opts.bilanLabel,
    vehicles: opts.vehicles,
    vehicleCount: opts.count,
    lane: opts.laneLabels.join(", "),
    impact: opts.impactLabel,
    trafficJamMeters: opts.trafficJamMeters > 0 ? opts.trafficJamMeters : null,
    damages: opts.damageLabels,
    bl: opts.victimes.bl,
    bg: opts.victimes.bg,
    tues: opts.victimes.tues,
    actors: opts.actorLabels,
    actionStatus: opts.actionStatusLabel,
  };
}