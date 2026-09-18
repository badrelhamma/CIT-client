import { describe, expect, it } from "vitest";
import { HIGHWAYS } from "../../../../data/highways";
import {
  googleMapsUrl,
  hasCoords,
  interpolateCoords,
  unzoom,
} from "../geo";

describe("hasCoords", () => {
  it("true pour un tableau valide", () => {
    expect(hasCoords(HIGHWAYS.find((h) => h.id === "A3")!.coords)).toBe(true);
  });

  it("false pour null", () => {
    expect(hasCoords(null)).toBe(false);
  });

  it("false pour undefined", () => {
    expect(hasCoords(undefined)).toBe(false);
  });
});

describe("interpolateCoords", () => {
  const A3 = HIGHWAYS.find((h) => h.id === "A3")!;

  it("interpole correctement entre deux points", () => {
    const result = interpolateCoords(A3.coords, 500)!;
    expect(result).not.toBeNull();
    // interpolation t=0.5 entre pk=0 et pk=1
    expect(result.lat).toBeCloseTo(33.501701, 3);
    expect(result.lon).toBeCloseTo(-7.6290245, 4);
  });

  it("retourne le premier point en dessous de la borne basse", () => {
    const result = interpolateCoords(A3.coords, -1000)!;
    expect(result!.lat).toBe(33.506244);
  });

  it("retourne le dernier point au-delà de la borne haute", () => {
    const A1 = HIGHWAYS.find((h) => h.id === "A1")!;
    const maxPk = Math.round(A1.lengthKm * 1000) + 1000;
    const result = interpolateCoords(A1.coords, maxPk)!;
    expect(result).not.toBeNull();
  });

  it("retourne null pour null", () => {
    expect(interpolateCoords(null, 1000)).toBeNull();
  });
});

describe("googleMapsUrl", () => {
  it("retourne l'URL attendue", () => {
    expect(googleMapsUrl(33.5, -7.63)).toBe(
      "https://www.google.com/maps/search/?api=1&query=33.5,-7.63",
    );
  });
});

describe("unzoom", () => {
  it("calcule des deltas corrects à l'équateur", () => {
    const d = unzoom(0, 111320);
    expect(d.latDelta).toBeCloseTo(1, 3);
    expect(d.lonDelta).toBeCloseTo(1, 3);
  });

  it("tient compte de la latitude pour lonDelta", () => {
    const d = unzoom(60, 111320);
    expect(d.lonDelta).toBeGreaterThan(1);
  });
});