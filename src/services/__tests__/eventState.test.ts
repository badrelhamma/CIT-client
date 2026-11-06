import { describe, expect, it } from "vitest";
import {
  EVENT_STATES,
  defaultStatusForState,
  eventMessageForState,
  statusesForState,
} from "../eventState";
import type { StatusDef } from "@/types";

const STATUSES: StatusDef[] = [
  { id: "confirmer", label: "En cours de confirmation" },
  { id: "confirme", label: "Confirmé" },
  { id: "intervention", label: "Intervention en cours" },
  { id: "leve", label: "Événement levé" },
  { id: "cloture", label: "Clôture" },
];

describe("EVENT_STATES", () => {
  it("expose les deux états attendus dans l'ordre", () => {
    expect(EVENT_STATES.map((state) => state.id)).toEqual([
      "confirmer",
      "confirme",
    ]);
    expect(EVENT_STATES.map((state) => state.label)).toEqual([
      "En cours de confirmation",
      "Confirmé",
    ]);
  });
});

describe("statusesForState", () => {
  it("exclut « Confirmé » et « Clôture » pour « En cours de confirmation »", () => {
    expect(statusesForState("confirmer", STATUSES).map((s) => s.id)).toEqual([
      "confirmer",
      "intervention",
      "leve",
    ]);
  });

  it("exclut « En cours de confirmation » et « Clôture » pour « Confirmé »", () => {
    expect(statusesForState("confirme", STATUSES).map((s) => s.id)).toEqual([
      "confirme",
      "intervention",
      "leve",
    ]);
  });
});

describe("defaultStatusForState", () => {
  it("sélectionne « En cours de confirmation » par défaut", () => {
    expect(defaultStatusForState("confirmer", STATUSES)?.label).toBe(
      "En cours de confirmation",
    );
  });

  it("sélectionne « Confirmé » par défaut", () => {
    expect(defaultStatusForState("confirme", STATUSES)?.label).toBe("Confirmé");
  });
});

describe("eventMessageForState", () => {
  it("utilise le message Recherche en cours de confirmation", () => {
    expect(
      eventMessageForState("confirmer", "message de recherche", "message de bilan"),
    ).toBe("message de recherche");
  });

  it("utilise le message Bilan quand l'événement est confirmé", () => {
    expect(
      eventMessageForState("confirme", "message de recherche", "message de bilan"),
    ).toBe("message de bilan");
  });
});
