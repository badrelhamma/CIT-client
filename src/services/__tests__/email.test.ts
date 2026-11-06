import { describe, expect, it } from "vitest";
import { isAdmEmail, normalizeEmail } from "@/services/email";

describe("adresses email ADM", () => {
  it("normalise la casse et les espaces", () => {
    expect(normalizeEmail("  Prenom.Nom@ADM.CO.MA ")).toBe(
      "prenom.nom@adm.co.ma",
    );
  });

  it("accepte uniquement le domaine adm.co.ma", () => {
    expect(isAdmEmail("prenom.nom@adm.co.ma")).toBe(true);
    expect(isAdmEmail("PRENOM.NOM@ADM.CO.MA")).toBe(true);
    expect(isAdmEmail("prenom.nom@gmail.com")).toBe(false);
    expect(isAdmEmail("prenom.nom@adm.co.ma.example")).toBe(false);
    expect(isAdmEmail("prenom.nom@sub.adm.co.ma")).toBe(false);
    expect(isAdmEmail("prenom.nom")).toBe(false);
  });
});
