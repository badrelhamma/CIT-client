import type { StatusDef } from "@/types";

/** États proposés par la page « Événement ». */
export type EventStateId = "confirmer" | "confirme";

export interface EventStateDef {
  id: EventStateId;
  label: string;
}

export const EVENT_STATES: EventStateDef[] = [
  { id: "confirmer", label: "En cours de confirmation" },
  { id: "confirme", label: "Confirmé" },
];

/** Statuts du référentiel compatibles avec un état de la page. */
export function statusesForState(
  state: EventStateId,
  statuses: StatusDef[],
): StatusDef[] {
  if (state === "confirme") {
    return statuses.filter((s) => s.id !== "confirmer" && s.id !== "cloture");
  }
  return statuses.filter((s) => s.id !== "confirme" && s.id !== "cloture");
}

/** Statut sélectionné par défaut lors du passage à un état. */
export function defaultStatusForState(
  state: EventStateId,
  statuses: StatusDef[],
): StatusDef | null {
  const preferredId = state === "confirme" ? "confirme" : "confirmer";
  return (
    statuses.find((s) => s.id === preferredId) ??
    statusesForState(state, statuses)[0] ??
    null
  );
}

/** Message ADM affiché selon l'état sélectionné. */
export function eventMessageForState(
  state: EventStateId,
  admMessage: string | null,
  bilanMessage: string | null,
): string | null {
  return state === "confirme" ? bilanMessage : admMessage;
}
