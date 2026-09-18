import { describe, expect, it } from "vitest";
import {
  extractVehicles,
  parseBilanText,
  resolveBilan,
} from "../bilanParse";
import type { BilanTypeDef, HistoryEvent } from "@/types";

const TEMPLATES: BilanTypeDef[] = [
  { id: "collision", template: "Collision entre nbr ?", hasVehicle: true, hasCount: true },
  { id: "derape-glissiere", template: "? a dérapé en heurtant la glissière", hasVehicle: true, hasCount: false },
  { id: "carambolage", template: "Carambolage entre nbr ?", hasVehicle: true, hasCount: true },
  { id: "feu-tpc", template: "Feu sur TPC", hasVehicle: false, hasCount: false },
];

function event(over: Partial<HistoryEvent>): HistoryEvent {
  return {
    id: "1",
    at: "2026-09-17T10:00:00.000Z",
    highway: "A3",
    pk: 248500,
    direction: "Vers Agadir",
    color: "orange",
    typeId: "carambolage",
    sourceIds: ["appel-5050"],
    statusId: "intervention",
    message: "",
    refCode: "PK1",
    replyTo: null,
    replySeq: 0,
    resolved: false,
    ...over,
  };
}

describe("extractVehicles", () => {
  it("extrait les véhicules d'un gabarit avec nombre", () => {
    expect(extractVehicles("Collision entre deux VL", TEMPLATES).vehicles).toBe("VL");
    expect(extractVehicles("Carambolage entre quatre VL", TEMPLATES).vehicles).toBe("VL");
  });

  it("extrait les véhicules d'un gabarit sans nombre", () => {
    expect(
      extractVehicles("VUL a dérapé en heurtant la glissière", TEMPLATES).vehicles,
    ).toBe("VUL");
  });
});

describe("parseBilanText", () => {
  it("parse les lignes d'un bilan complet", () => {
    const text = [
      "🟠 *Carambolage entre quatre VL*",
      "⏳ *Intervention en cours PK: 248+500*",
      "*Voie impactée* : Voie rapide",
      "*Impact sur la circulation* : Bouchon à 1200 m",
      "*Dégâts* : Matériels, Corporels",
      "*Bilan provisoire* : 2 BL · 1 BG",
      "*Action* : Patrouilleur sur place",
    ].join("\n");

    const parsed = parseBilanText(text, TEMPLATES);
    expect(parsed.label).toBe("Carambolage entre quatre VL");
    expect(parsed.vehicles).toBe("VL");
    expect(parsed.lane).toBe("Voie rapide");
    expect(parsed.impact).toBe("Bouchon à 1200 m");
    expect(parsed.trafficJamMeters).toBe(1200);
    expect(parsed.damages).toBe("Matériels, Corporels");
    expect(parsed.bl).toBe(2);
    expect(parsed.bg).toBe(1);
    expect(parsed.tues).toBe(0);
  });

  it("gère l'ancien format « *Impact* »", () => {
    const parsed = parseBilanText("*Impact* : Bouchon à 2500 m", TEMPLATES);
    expect(parsed.impact).toBe("Bouchon à 2500 m");
    expect(parsed.trafficJamMeters).toBe(2500);
  });

  it("gère « Aucun dégât signalé »", () => {
    const parsed = parseBilanText("*Aucun dégât signalé*", TEMPLATES);
    expect(parsed.damages).toBe("Aucun dégât signalé");
  });

  it("parse l'ancien format « *Bilan* »", () => {
    const parsed = parseBilanText("*Bilan* : 1 BL · 1 BG", TEMPLATES);
    expect(parsed.bl).toBe(1);
    expect(parsed.bg).toBe(1);
    expect(parsed.hasVictimes).toBe(true);
  });
});

describe("resolveBilan", () => {
  it("privilégie les données structurées stockées sur le texte", () => {
    const resolved = resolveBilan(
      event({
        message: "*Voie impactée* : Voie lente",
        bilan: {
          vehicles: ["PL"],
          lane: "Voie rapide",
          impact: "Bouchon",
          trafficJamMeters: 800,
          damages: ["Matériels"],
          bl: 2,
          bg: 1,
          tues: 0,
        },
      }),
      TEMPLATES,
    );

    expect(resolved.vehicles).toBe("PL");
    expect(resolved.lane).toBe("Voie rapide");
    expect(resolved.impact).toBe("Bouchon");
    expect(resolved.trafficJamMeters).toBe(800);
    expect(resolved.damages).toBe("Matériels");
    expect(resolved.bl).toBe(2);
    expect(resolved.bg).toBe(1);
  });

  it("retombe sur le parsing du texte sans données structurées", () => {
    const resolved = resolveBilan(
      event({
        message: [
          "🟠 *Collision entre deux VL*",
          "*Voie impactée* : Voie médiane",
          "*Dégâts* : Corporels",
          "*Bilan provisoire* : 1 BL",
        ].join("\n"),
      }),
      TEMPLATES,
    );

    expect(resolved.label).toBe("Collision entre deux VL");
    expect(resolved.vehicles).toBe("VL");
    expect(resolved.lane).toBe("Voie médiane");
    expect(resolved.damages).toBe("Corporels");
    expect(resolved.bl).toBe(1);
  });
});
