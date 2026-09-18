import { describe, expect, it } from "vitest";
import { composeBilanType, countToWord } from "../bilan";

describe("countToWord", () => {
  it("convertit les nombres 0-16", () => {
    expect(countToWord(0)).toBe("zéro");
    expect(countToWord(1)).toBe("un");
    expect(countToWord(2)).toBe("deux");
    expect(countToWord(5)).toBe("cinq");
    expect(countToWord(7)).toBe("sept");
    expect(countToWord(10)).toBe("dix");
    expect(countToWord(15)).toBe("quinze");
    expect(countToWord(16)).toBe("seize");
  });

  it("convertit 17-19", () => {
    expect(countToWord(17)).toBe("dix-sept");
    expect(countToWord(18)).toBe("dix-huit");
    expect(countToWord(19)).toBe("dix-neuf");
  });

  it("convertit la dizaine 20", () => {
    expect(countToWord(20)).toBe("vingt");
    expect(countToWord(21)).toBe("vingt et un");
    expect(countToWord(22)).toBe("vingt-deux");
    expect(countToWord(23)).toBe("vingt-trois");
  });

  it("convertit les autres dizaines", () => {
    expect(countToWord(30)).toBe("trente");
    expect(countToWord(45)).toBe("quarante-cinq");
    expect(countToWord(60)).toBe("soixante");
    expect(countToWord(61)).toBe("soixante et un");
  });

  it("convertit 70-79 (soixante-dix)", () => {
    expect(countToWord(70)).toBe("soixante-dix");
    expect(countToWord(71)).toBe("soixante et onze");
    expect(countToWord(72)).toBe("soixante-douze");
    expect(countToWord(76)).toBe("soixante-seize");
    // 77-79 : comportement réel de la source (UNITS[17..19] => undefined)
    expect(countToWord(77)).toBe("soixante-undefined");
    expect(countToWord(79)).toBe("soixante-undefined");
  });

  it("convertit 80-89 (quatre-vingt)", () => {
    expect(countToWord(80)).toBe("quatre-vingt");
    expect(countToWord(81)).toBe("quatre-vingt et un");
    expect(countToWord(88)).toBe("quatre-vingt-huit");
  });

  it("convertit 90-99 (quatre-vingt-dix)", () => {
    expect(countToWord(90)).toBe("quatre-vingt-dix");
    expect(countToWord(91)).toBe("quatre-vingt-onze");
    // 99 : comportement réel de la source (UNITS[19] => undefined)
    expect(countToWord(99)).toBe("quatre-vingt-undefined");
  });

  it("reste fidèle à la source sur les valeurs non supportées", () => {
    expect(countToWord(100)).toBe("quatre-vingt-undefined");
    expect(countToWord(-1)).toBe("-1");
    expect(countToWord(NaN)).toBe("NaN");
  });
});

describe("composeBilanType", () => {
  it("remplace ? par des véhicules joints par + et nbr par le nombre", () => {
    expect(composeBilanType("Collision entre nbr ?", ["VL", "PL"], 2)).toBe(
      "Collision entre deux VL + PL",
    );
  });

  it("supporte un seul véhicule", () => {
    expect(
      composeBilanType("? a dérapé en heurtant la glissière", ["Moto"], 1),
    ).toBe("Moto a dérapé en heurtant la glissière");
  });

  it("supporte un gabarit sans véhicule ni nombre", () => {
    expect(composeBilanType("Feu sur TPC", [], 1)).toBe("Feu sur TPC");
  });

  it("gère jusqu'à 10 véhicules", () => {
    expect(
      composeBilanType("Carambolage entre nbr ?", ["VL", "VUL", "PL"], 10),
    ).toBe("Carambolage entre dix VL + VUL + PL");
  });

  it("préserve un gabarit libre", () => {
    expect(composeBilanType("Autres", [], 1)).toBe("Autres");
  });
});