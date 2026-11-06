import { describe, expect, it } from "vitest";
import {
  canAccessScreen,
  canAddCompteRendu,
  hasPermission,
  isPrincipal,
} from "@/services/access";
import type { AuthUser, PermissionKey, Role } from "@/types";

function makeUser(
  role: Role,
  permissions: PermissionKey[] = [],
): AuthUser {
  return {
    id: "user-1",
    name: "Utilisateur Test",
    identifier: "utilisateur.test",
    email: "utilisateur.test@adm.co.ma",
    role,
    permissions,
    active: true,
  };
}

describe("permissions client", () => {
  it("accorde tous les droits au Manager principal", () => {
    const user = makeUser("Manager principal");
    expect(isPrincipal(user)).toBe(true);
    expect(hasPermission(user, "page:historique")).toBe(true);
    expect(hasPermission(user, "history:comment")).toBe(true);
    expect(canAccessScreen(user, "administration")).toBe(true);
  });

  it("limite un Manager à ses permissions explicites", () => {
    const user = makeUser("Manager", ["page:historique", "history:comment"]);
    expect(canAccessScreen(user, "historique")).toBe(true);
    expect(canAccessScreen(user, "historiqueEncours")).toBe(true);
    expect(canAccessScreen(user, "evenement")).toBe(false);
    expect(canAccessScreen(user, "administration")).toBe(false);
    expect(hasPermission(user, "history:comment")).toBe(true);
    expect(hasPermission(user, "page:tmd")).toBe(false);
  });

  it("applique les permissions aux sous-pages Compte rendu", () => {
    const director = makeUser("Directeur", ["page:compte-rendu"]);
    expect(canAccessScreen(director, "compteRendu")).toBe(true);
    expect(canAccessScreen(director, "listeCr")).toBe(true);
    expect(canAccessScreen(director, "ajouterCr")).toBe(false);
    expect(canAccessScreen(director, "reseau")).toBe(false);

    const manager = makeUser("Manager", ["page:compte-rendu"]);
    expect(canAccessScreen(manager, "ajouterCr")).toBe(true);
  });

  it("refuse toutes les pages sans permission et sans utilisateur", () => {
    const user = makeUser("Manager");
    expect(canAccessScreen(user, "historique")).toBe(false);
    expect(canAccessScreen(user, "administration")).toBe(false);
    expect(canAccessScreen(null, "historique")).toBe(false);
    expect(hasPermission(null, "page:historique")).toBe(false);
  });

  it("n'autorise pas un Directeur à ajouter un compte rendu", () => {
    const director = makeUser("Directeur", ["page:compte-rendu"]);
    expect(canAccessScreen(director, "listeCr")).toBe(true);
    expect(canAccessScreen(director, "ajouterCr")).toBe(false);
    expect(canAddCompteRendu(director)).toBe(false);

    const manager = makeUser("Manager", ["page:compte-rendu"]);
    expect(canAccessScreen(manager, "ajouterCr")).toBe(true);

    const principal = makeUser("Manager principal");
    expect(canAccessScreen(principal, "ajouterCr")).toBe(true);
  });
});
