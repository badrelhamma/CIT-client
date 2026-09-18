import { describe, expect, it } from "vitest";
import { HIGHWAYS } from "../../../../data/highways";
import {
  findNearestLocation,
  formatDistance,
  formatPk,
  formatPkKm,
  locationLabel,
  parsePk,
} from "../location";

const A2 = HIGHWAYS.find((h) => h.id === "A2")!;
const A1 = HIGHWAYS.find((h) => h.id === "A1")!;

describe("parsePk", () => {
  it("accepte 358+070 → 358070 m", () => {
    expect(parsePk("358+070", A2)).toBe(358070);
  });

  it("accepte 358.070 → 358070 m", () => {
    expect(parsePk("358.070", A2)).toBe(358070);
  });

  it("accepte 358,07 → 358070 m", () => {
    expect(parsePk("358,07", A2)).toBe(358070);
  });

  it("accepte 358070 → 358070 m", () => {
    expect(parsePk("358070", A2)).toBe(358070);
  });

  it("interprète un entier court comme des kilomètres (358 → 358000 m)", () => {
    // Décision documentée : « 358 » est interprété en km (358 km = 358000 m).
    expect(parsePk("358", A2)).toBe(358000);
  });

  it("accepte un PK kilometrique avec virgule 1,7 → 1700 m", () => {
    expect(parsePk("1,7", A1)).toBe(1700);
  });

  it("rejette une saisie invalide", () => {
    expect(parsePk("abc", A2)).toBeNull();
    expect(parsePk("", A2)).toBeNull();
    expect(parsePk("12+abc", A2)).toBeNull();
  });

  it("rejette un PK hors axe", () => {
    expect(parsePk("494", A2)).toBeNull();
    expect(parsePk("999999", A2)).toBeNull();
    expect(parsePk("-5", A2)).toBeNull();
  });
});

describe("formatPk", () => {
  it("358070 → 358+070", () => {
    expect(formatPk(358070)).toBe("358+070");
  });

  it("padde les mètres à 3 chiffres", () => {
    expect(formatPk(5000)).toBe("5+000");
    expect(formatPk(12345)).toBe("12+345");
  });
});

describe("formatPkKm", () => {
  it("358070 → 358", () => {
    expect(formatPkKm(358070)).toBe("358");
  });
});

describe("formatDistance", () => {
  it("affiche en km à deux chiffres à partir de 950 m", () => {
    expect(formatDistance(1930)).toBe("02 km");
    expect(formatDistance(950)).toBe("01 km");
    expect(formatDistance(5000)).toBe("05 km");
    expect(formatDistance(12500)).toBe("13 km");
  });

  it("arrondit à la dizaine sous 950 m, minimum 10 m", () => {
    expect(formatDistance(358)).toBe("360 m");
    expect(formatDistance(24)).toBe("20 m");
    expect(formatDistance(8)).toBe("10 m");
    expect(formatDistance(0)).toBe("10 m");
  });
});

describe("findNearestLocation", () => {
  it("scénario A2 PK 358+070 en Sens A → après Guercif, destination Rabat", () => {
    const r = findNearestLocation(A2, 358070, A2.dirA)!;
    expect(r).not.toBeNull();
    expect(r.nearest.name).toBe("Guercif");
    expect(r.nearest.pk).toBe(360000);
    expect(r.distanceM).toBe(1930);
    expect(r.side).toBe("après");
    expect(r.distanceLabel).toBe("02 km");
    expect(r.destination).toBe("Rabat");
    expect(r.previous?.name).toBe("Msoun");
    expect(r.next?.name).toBe("Guercif");
  });

  it("scénario A2 PK 358+070 en Sens B → avant Guercif, destination Oujda", () => {
    const r = findNearestLocation(A2, 358070, A2.dirB)!;
    expect(r.side).toBe("avant");
    expect(r.destination).toBe("Oujda");
    expect(r.distanceLabel).toBe("02 km");
  });

  it("un PK exact sur un repère → egal", () => {
    const r = findNearestLocation(A1, 168000, A1.dirB)!;
    expect(r.nearest.name).toBe("El Jadida");
    expect(r.side).toBe("egal");
    expect(r.distanceM).toBe(0);
  });

  it("préfère le repère précédent en cas d'égalité", () => {
    const r = findNearestLocation(A1, 78000, A1.dirB)!;
    // 78000 : à égale distance de 76000 (Casa Port) et 80000 (Casa Mediouna)
    expect(r.distanceM).toBe(2000);
    expect(r.nearest.name).toBe("Casa Port");
    expect(r.nearest.pk).toBe(76000);
  });

  it("gère un PK avant le premier repère (previous null)", () => {
    const r = findNearestLocation(A1, 0, A1.dirB)!;
    expect(r.previous).toBeNull();
    expect(r.next?.name).toBe("Rabat (Hay Riad)");
    expect(r.side).toBe("avant");
  });

  it("retourne null si aucun repère", () => {
    const empty = { ...A1, landmarks: [] };
    expect(findNearestLocation(empty, 1000, A1.dirA)).toBeNull();
  });
});

describe("locationLabel", () => {
  it("produit la localisation du scénario A2", () => {
    expect(locationLabel(A2, 358070, A2.dirA)).toBe("02 km après Guercif");
  });

  it("produit « À hauteur de » pour un PK sur repère", () => {
    expect(locationLabel(A1, 168000, A1.dirB)).toBe("À hauteur de El Jadida");
  });
});