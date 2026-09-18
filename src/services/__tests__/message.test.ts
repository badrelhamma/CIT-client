import { describe, expect, it } from "vitest";
import { buildAdmMessage, buildBilanMessage } from "../message";

describe("buildAdmMessage", () => {
  it("produit le message complet du scénario A2 PK 358+070", () => {
    const result = buildAdmMessage({
      colorEmoji: "🟡",
      typeLabel: "Accident d'un seul véhicule léger",
      highwayId: "A2",
      pk: 358070,
      location: "02 km après Guercif",
      destination: "Rabat",
      sources: ["Caméra"],
      statusLabel: "En cours de confirmation",
    });

    const expected = [
      "🟡 *Accident d'un seul véhicule léger*",
      "📍 *A2 / PK 358 / 02 km après Guercif ➡️ Rabat*",
      "*Détection* : Caméra",
      "*En cours de confirmation*",
    ].join("\n");

    expect(result).toBe(expected);
  });

  it("gère plusieurs sources de détection", () => {
    const result = buildAdmMessage({
      colorEmoji: "🔴",
      typeLabel: "Carambolage",
      highwayId: "A1",
      pk: 42500,
      location: "À hauteur de Mohammédia Est",
      destination: "Safi",
      sources: ["Patrouille", "usager 5050"],
      statusLabel: "Confirmé",
    });

    expect(result).toContain("*Détection* : Patrouille, usager 5050");
  });

  it("omet la ligne détection si aucune source", () => {
    const result = buildAdmMessage({
      colorEmoji: "🟠",
      typeLabel: "Panne",
      highwayId: "A3",
      pk: 100000,
      location: "05 km avant Berrechid",
      destination: "Agadir",
      sources: [],
      statusLabel: "Événement levé",
    });

    expect(result).not.toContain("Détection");
    expect(result.split("\n")).toHaveLength(3);
  });

  it("ajoute les options Bilan au message Recherche quand confirmé", () => {
    const result = buildAdmMessage({
      colorEmoji: "🟡",
      typeLabel: "Collision entre 2 VL",
      highwayId: "A2",
      pk: 358070,
      location: "02 km avant Guercif",
      destination: "Rabat",
      sources: ["Patrouille"],
      statusLabel: "Confirmé",
      bilan: {
        laneLabel: "Voie 2",
        impactLabel: "Ralentissement",
        damageLabels: ["Matériels", "Corporels"],
        victimes: { bl: 2, bg: 1, tues: 0 },
        actorLabels: ["Patrouilleur", "Gendarmerie"],
        actionStatusLabel: "sur place",
      },
    });

    const expected = [
      "🟡 *Collision entre 2 VL*",
      "📍 *A2 / PK 358 / 02 km avant Guercif ➡️ Rabat*",
      "*Détection* : Patrouille",
      "⏳ *Confirmé*",
      "*Voie impactée* : Voie 2",
      "*Impact sur la circulation* : Ralentissement",
      "*Dégâts* : Matériels, Corporels",
      "*Bilan provisoire* : 2 BL · 1 BG",
      "*Action* : Patrouilleur, Gendarmerie sur place",
    ].join("\n");

    expect(result).toBe(expected);
  });

  it("garde le format simple pour un événement non confirmé (sans bilan)", () => {
    const result = buildAdmMessage({
      colorEmoji: "🟠",
      typeLabel: "Panne",
      highwayId: "A3",
      pk: 100000,
      location: "05 km avant Berrechid",
      destination: "Agadir",
      sources: ["Caméra"],
      statusLabel: "En cours de confirmation",
    });

    expect(result).toContain("*En cours de confirmation*");
    expect(result).not.toContain("⏳");
    expect(result).not.toContain("*Voie impactée*");
    expect(result.split("\n")).toHaveLength(4);
  });
});

describe("buildBilanMessage", () => {
  it("reproduit l'exemple ADM « Bilan / Mise à jour » (PK confirmé)", () => {
    const result = buildBilanMessage({
      colorEmoji: "🟡",
      bilanLabel: "Collision entre 2 VL",
      statusLabel: "Confirmé",
      confirmedPkLabel: "358+070",
      laneLabel: "Voie 2",
      impactLabel: "Ralentissement",
      damageLabels: ["Matériels", "Corporels"],
      victimes: { bl: 2, bg: 1, tues: 0 },
      actorLabels: ["Patrouilleur", "Gendarmerie"],
      actionStatusLabel: "sur place",
    });

    const expected = [
      "🟡 *Collision entre 2 VL*",
      "⏳ *Confirmé PK: 358+070*",
      "*Voie impactée* : Voie 2",
      "*Impact sur la circulation* : Ralentissement",
      "*Dégâts* : Matériels, Corporels",
      "*Bilan provisoire* : 2 BL · 1 BG",
      "*Action* : Patrouilleur, Gendarmerie sur place",
    ].join("\n");

    expect(result).toBe(expected);
  });

  it("préfixe toujours le statut de ⏳ sauf si emoji fourni", () => {
    const defaut = buildBilanMessage({
      colorEmoji: "🔴",
      bilanLabel: "Collision entre deux VL + PL",
      statusLabel: "Intervention en cours",
      laneLabel: "BAU, BCD",
      impactLabel: "Bouchon",
      trafficJamMeters: 1500,
      damageLabels: ["Matériels", "Infrastructures"],
      actorLabels: ["Patrouilleur", "Dépannage"],
      actionStatusLabel: "sur place",
    });
    expect(defaut).toContain("⏳ *Intervention en cours*");
    expect(defaut).toContain("*Impact sur la circulation* : Bouchon · 1500 m");
    expect(defaut).not.toContain("📍");
    expect(defaut).toContain("*Action* : Patrouilleur, Dépannage sur place");

    const avecEmoji = buildBilanMessage({
      colorEmoji: "🟠",
      bilanLabel: "Carambolage",
      statusLabel: "Confirmé",
      statusEmoji: "✅",
      laneLabel: "—",
      impactLabel: "—",
      damageLabels: [],
      actorLabels: [],
      actionStatusLabel: "en route",
    });
    expect(avecEmoji).toContain("✅ *Confirmé*");
  });

  it("ajoute PK au statut confirmé, la localisation et le bilan provisoire", () => {
    const result = buildBilanMessage({
      colorEmoji: "🟠",
      bilanLabel: "Carambolage entre trois VL",
      statusLabel: "Confirmé",
      confirmedPkLabel: "358+070",
      locationLine: "📍 *A2 / PK 358 / 02 km avant Guercif ➡️ Rabat*",
      laneLabel: "BCD",
      impactLabel: "Ralentissement",
      damageLabels: ["Corporels"],
      victimes: { bl: 2, bg: 1, tues: 0 },
      actorLabels: ["Pompiers"],
      actionStatusLabel: "en route",
    });

    expect(result).toContain("⏳ *Confirmé PK: 358+070*");
    expect(result).toContain("📍 *A2 / PK 358 / 02 km avant Guercif ➡️ Rabat*");
    expect(result).toContain("*Bilan provisoire* : 2 BL · 1 BG");
    expect(result).toContain("*Action* : Pompiers en route");
  });

  it("affiche des valeurs par défaut quand aucun choix n'est fait", () => {
    const result = buildBilanMessage({
      colorEmoji: "🟡",
      bilanLabel: "Feu sur TPC",
      statusLabel: "Confirmé",
      laneLabel: "—",
      impactLabel: "—",
      damageLabels: [],
      actorLabels: [],
      actionStatusLabel: "sur place",
    });

    expect(result).toContain("*Voie impactée* : —");
    expect(result).toContain("*Impact sur la circulation* : —");
    expect(result).toContain("*Dégâts* : Aucun dégât signalé");
    expect(result).not.toContain("*Bilan provisoire*");
    expect(result).toContain("*Action* : Aucun intervenant sur place");
  });

  it("n'affiche que les valeurs de victimes supérieures à 0", () => {
    const singulier = buildBilanMessage({
      colorEmoji: "🔴",
      bilanLabel: "Carambolage",
      statusLabel: "Confirmé",
      laneLabel: "—",
      impactLabel: "—",
      damageLabels: ["Corporels"],
      victimes: { bl: 0, bg: 0, tues: 1 },
      actorLabels: [],
      actionStatusLabel: "sur place",
    });
    expect(singulier).toContain("*Bilan provisoire* : 1 Tué");

    const pluriel = buildBilanMessage({
      colorEmoji: "🔴",
      bilanLabel: "Carambolage",
      statusLabel: "Confirmé",
      laneLabel: "—",
      impactLabel: "—",
      damageLabels: ["Corporels"],
      victimes: { bl: 0, bg: 0, tues: 3 },
      actorLabels: [],
      actionStatusLabel: "sur place",
    });
    expect(pluriel).toContain("*Bilan provisoire* : 3 Tués");
  });
});