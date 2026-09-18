import { describe, expect, it } from "vitest";
import { waShareUrl } from "../share";

describe("waShareUrl", () => {
  it("encode correctement un message texte", () => {
    const input = "🟡 *Test*";
    const result = waShareUrl(input);
    expect(result).toBe(
      `https://wa.me/?text=${encodeURIComponent(input)}`,
    );
  });

  it("encode les caractères spéciaux", () => {
    const result = waShareUrl("A2 / PK 358 / 02 km");
    expect(result).toContain(encodeURIComponent("A2 / PK 358 / 02 km"));
  });
});