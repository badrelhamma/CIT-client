import { formatPkKm } from "./location";

export interface AdmMessageInput {
  colorEmoji: string;
  typeLabel: string;
  highwayId: string;
  pk: number;
  location: string;
  destination: string;
  sources: string[];
  statusLabel: string;
  /** Sections bilan ajoutées au message « Recherche » quand l'événement est
   *  confirmé (statut préfixé par « ⏳ ») et non signalé par usager 5050. */
  bilan?: BilanSuffix | null;
}

export function buildAdmMessage(input: AdmMessageInput): string {
  const sourceLine = input.sources.length
    ? `*Détection* : ${input.sources.join(", ")}`
    : "";
  const lines = [
    `${input.colorEmoji} *${input.typeLabel}*`,
    `📍 *${input.highwayId} / PK ${formatPkKm(input.pk)} / ${input.location} ➡️ ${input.destination}*`,
  ];
  if (sourceLine) lines.push(sourceLine);
  lines.push(input.bilan ? `⏳ *${input.statusLabel}*` : `*${input.statusLabel}*`);
  if (input.bilan) lines.push(...buildBilanSuffixLines(input.bilan));
  return lines.join("\n");
}

/** Bloc « Bilan / Mise à jour » commun au message « Recherche » confirmé et au
 *  message « Bilan / Mise à jour » (Voie impactée, Impact, Dégâts, Bilan
 *  provisoire, Action). */
export interface BilanSuffix {
  /** Libellé(s) de la voie impactée. */
  laneLabel: string;
  impactLabel: string;
  /** Longueur du bouchon en mètres (uniquement si impact = Bouchon). */
  trafficJamMeters?: number | null;
  damageLabels: string[];
  /** Bilan provisoire (BL/BG/Tués) affiché si « Corporels » est sélectionné. */
  victimes?: BilanVictimes | null;
  actorLabels: string[];
  actionStatusLabel: string;
}

/** Bilan provisoire en cas de dégâts corporels. */
export interface BilanVictimes {
  bl: number;
  bg: number;
  tues: number;
}

export function buildBilanSuffixLines(suffix: BilanSuffix): string[] {
  const lines: string[] = [];

  lines.push(`*Voie impactée* : ${suffix.laneLabel}`);

  const impactText =
    suffix.trafficJamMeters != null && suffix.trafficJamMeters > 0
      ? `${suffix.impactLabel} · ${suffix.trafficJamMeters} m`
      : suffix.impactLabel;
  lines.push(`*Impact sur la circulation* : ${impactText}`);

  lines.push(
    `*Dégâts* : ${
      suffix.damageLabels.length > 0
        ? suffix.damageLabels.join(", ")
        : "Aucun dégât signalé"
    }`,
  );

  /* Bilan provisoire : uniquement les valeurs supérieures à 0. */
  if (suffix.victimes) {
    const parts: string[] = [];
    if (suffix.victimes.bl > 0) parts.push(`${suffix.victimes.bl} BL`);
    if (suffix.victimes.bg > 0) parts.push(`${suffix.victimes.bg} BG`);
    if (suffix.victimes.tues > 0)
      parts.push(`${suffix.victimes.tues} Tué${suffix.victimes.tues > 1 ? "s" : ""}`);
    if (parts.length) lines.push(`*Bilan provisoire* : ${parts.join(" · ")}`);
  }

  lines.push(
    `*Action* : ${
      suffix.actorLabels.length > 0
        ? suffix.actorLabels.join(", ")
        : "Aucun intervenant"
    } ${suffix.actionStatusLabel}`,
  );

  return lines;
}

export interface BilanMessageInput extends BilanSuffix {
  colorEmoji: string;
  bilanLabel: string;
  statusLabel: string;
  /** Emoji du statut (« ⏳ » par défaut si absent). */
  statusEmoji?: string | null;
  /** PK formaté « 358+070 » ajouté au statut quand l'événement est confirmé. */
  confirmedPkLabel?: string | null;
  /** Ligne « 📍 *A2 / PK …* » affichée quand le statut est confirmé. */
  locationLine?: string | null;
}

/**
 * Génère le message ADM « Bilan / Mise à jour » partagé sur WhatsApp, ex.
 * (PK saisi + statut « Confirmé ») :
 *
 * 🟡 *Collision entre 2 VL*
 * ⏳ *Confirmé PK: 358+070*
 * *Voie impactée* : Voie 2
 * *Impact sur la circulation* : Ralentissement
 * *Dégâts* : Matériels, Corporels
 * *Bilan provisoire* : 2 BL · 1 BG   (seules les valeurs > 0 sont affichées)
 * *Action* : Patrouilleur, Gendarmerie sur place
 */
export function buildBilanMessage(input: BilanMessageInput): string {
  const lines = [`${input.colorEmoji} *${input.bilanLabel}*`];

  const statusPrefix =
    input.statusEmoji && input.statusEmoji.trim().length > 0
      ? `${input.statusEmoji} `
      : "⏳ ";
  const statusText = input.confirmedPkLabel
    ? `${input.statusLabel} PK: ${input.confirmedPkLabel}`
    : input.statusLabel;
  lines.push(`${statusPrefix}*${statusText}*`);

  if (input.locationLine) lines.push(input.locationLine);

  lines.push(...buildBilanSuffixLines(input));

  return lines.join("\n");
}