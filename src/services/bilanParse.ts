import type { BilanTypeDef, HistoryEvent, HistoryReply } from "@/types";

/** Champs de bilan dérivés, soit des données structurées stockées, soit du
 *  texte du message (anciens événements). */
export interface ResolvedBilan {
  label: string;
  vehicles: string;
  lane: string;
  impact: string;
  trafficJamMeters: number | null;
  damages: string;
  bl: number;
  bg: number;
  tues: number;
  hasVictimes: boolean;
}

const EMPTY: ResolvedBilan = {
  label: "",
  vehicles: "",
  lane: "",
  impact: "",
  trafficJamMeters: null,
  damages: "",
  bl: 0,
  bg: 0,
  tues: 0,
  hasVictimes: false,
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+^${}()|[\]\\]/g, "\\$&");
}

function strip(value: string): string {
  return value.replace(/^\*+|\*+$/g, "").replace(/\s+/g, " ").trim();
}

/** Extrait les véhicules (et le nombre) d'un libellé de bilan en le comparant
 *  aux gabarits (`?` → véhicules, `nbr` → nombre en toutes lettres). */
export function extractVehicles(
  label: string,
  templates: BilanTypeDef[],
): { vehicles: string; count: string } {
  const target = label.trim();
  if (!target) return { vehicles: "", count: "" };

  for (const template of templates) {
    if (!template.hasVehicle && !template.hasCount) continue;
    const parts = template.template.split(/(\?|nbr)/);
    const markers: ("vehicle" | "count")[] = [];
    let pattern = "^";
    for (const part of parts) {
      if (part === "?") {
        pattern += "(.+?)";
        markers.push("vehicle");
      } else if (part === "nbr") {
        pattern += "(.+?)";
        markers.push("count");
      } else {
        pattern += escapeRegex(part);
      }
    }
    pattern += "$";

    const match = target.match(new RegExp(pattern, "i"));
    if (match) {
      let vehicles = "";
      let count = "";
      markers.forEach((marker, index) => {
        if (marker === "vehicle") vehicles = match[index + 1].trim();
        else count = match[index + 1].trim();
      });
      return { vehicles, count };
    }
  }
  return { vehicles: "", count: "" };
}

function parseVictimes(line: string): Pick<ResolvedBilan, "bl" | "bg" | "tues"> {
  const bl = line.match(/(\d+)\s*BL/i);
  const bg = line.match(/(\d+)\s*BG/i);
  const tues = line.match(/(\d+)\s*Tu[ée]s?/i);
  return {
    bl: bl ? Number(bl[1]) : 0,
    bg: bg ? Number(bg[1]) : 0,
    tues: tues ? Number(tues[1]) : 0,
  };
}

/** Analyse le texte d'un message pour en extraire les champs du bilan. */
export function parseBilanText(
  text: string,
  templates: BilanTypeDef[],
): ResolvedBilan {
  const result: ResolvedBilan = { ...EMPTY };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    let match: RegExpMatchArray | null;

    if ((match = line.match(/\*?Voie impactée\*?\s*:\s*(.+)$/i))) {
      result.lane = strip(match[1]);
      continue;
    }
    if (/^\*?Aucun dégât signalé\*?/i.test(line)) {
      result.damages = "Aucun dégât signalé";
      continue;
    }
    if ((match = line.match(/\*?Dégâts\*?\s*:\s*(.+)$/i))) {
      result.damages = strip(match[1]);
      continue;
    }
    if ((match = line.match(/\*?Impact(?: sur la circulation)?\*?\s*:\s*(.+)$/i))) {
      const value = strip(match[1]);
      result.impact = value;
      const meters = value.match(/(\d[\d\s]*)\s*m\b/i);
      if (meters) {
        const parsedMeters = Number(meters[1].replace(/\s/g, ""));
        if (Number.isFinite(parsedMeters)) result.trafficJamMeters = parsedMeters;
      }
      continue;
    }
    if ((match = line.match(/\*?(?:Bilan provisoire|Bilan)\*?\s*:\s*(.+)$/i))) {
      const victims = parseVictimes(strip(match[1]));
      result.bl = victims.bl;
      result.bg = victims.bg;
      result.tues = victims.tues;
      result.hasVictimes = true;
      continue;
    }
  }

  const title = text.match(/\*([^*]+)\*/);
  if (title) {
    result.label = title[1].trim();
    const { vehicles } = extractVehicles(result.label, templates);
    result.vehicles = vehicles;
  }

  return result;
}

function pick(stored: string | null | undefined, parsed: string): string {
  return stored !== undefined && stored !== null && stored !== ""
    ? stored
    : parsed;
}

function storedHasVictimes(
  stored: HistoryEvent["bilan"] | HistoryReply["bilan"],
): boolean {
  if (!stored) return false;
  const total = (stored.bl ?? 0) + (stored.bg ?? 0) + (stored.tues ?? 0);
  if (total > 0) return true;
  return (stored.damages ?? []).some((d) => /corporel/i.test(d));
}

function mergeInto(
  base: ResolvedBilan,
  parsed: ResolvedBilan,
  stored: HistoryEvent["bilan"] | HistoryReply["bilan"],
): ResolvedBilan {
  return {
    label: pick(stored?.label, parsed.label) || base.label,
    vehicles:
      (stored?.vehicles && stored.vehicles.length > 0
        ? stored.vehicles.join(" + ")
        : parsed.vehicles) || base.vehicles,
    lane: pick(stored?.lane, parsed.lane) || base.lane,
    impact: pick(stored?.impact, parsed.impact) || base.impact,
    trafficJamMeters:
      stored?.trafficJamMeters ?? parsed.trafficJamMeters ?? base.trafficJamMeters,
    damages:
      (stored?.damages && stored.damages.length > 0
        ? stored.damages.join(", ")
        : parsed.damages) || base.damages,
    bl: stored ? stored.bl ?? 0 : parsed.hasVictimes ? parsed.bl : base.bl,
    bg: stored ? stored.bg ?? 0 : parsed.hasVictimes ? parsed.bg : base.bg,
    tues: stored ? stored.tues ?? 0 : parsed.hasVictimes ? parsed.tues : base.tues,
    hasVictimes:
      base.hasVictimes || parsed.hasVictimes || storedHasVictimes(stored),
  };
}

/** Fusionne l'événement et ses réponses (structuré prioritaire, texte en
 *  secours) pour obtenir la dernière valeur connue de chaque champ. */
export function resolveBilan(
  event: HistoryEvent,
  templates: BilanTypeDef[],
): ResolvedBilan {
  let result: ResolvedBilan = { ...EMPTY };
  result = mergeInto(result, parseBilanText(event.message, templates), event.bilan);
  for (const reply of event.replies ?? []) {
    result = mergeInto(
      result,
      parseBilanText(reply.message, templates),
      reply.bilan,
    );
  }
  return result;
}
