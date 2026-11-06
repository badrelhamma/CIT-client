import { describe, expect, it } from "vitest";
import { filterCompteRendusForUser } from "@/services/compteRenduOwnership";
import type { AuthUser, PermissionKey, Role } from "@/types";

function makeUser(
  id: string,
  role: Role,
  permissions: PermissionKey[] = [],
): AuthUser {
  return {
    id,
    name: `Utilisateur ${id}`,
    identifier: `utilisateur.${id}`,
    email: `utilisateur.${id}@adm.co.ma`,
    role,
    permissions,
    active: true,
  };
}

const entries = [
  { id: "cr-1", ownerId: "user-1" },
  { id: "cr-2", ownerId: "user-2" },
  { id: "cr-3" },
];

describe("visibilité des comptes rendus", () => {
  it("limite un utilisateur à ses propres comptes rendus", () => {
    const manager = makeUser("user-1", "Manager", ["page:compte-rendu"]);
    expect(filterCompteRendusForUser(entries, manager).map((e) => e.id)).toEqual([
      "cr-1",
    ]);
  });

  it("affiche tous les comptes rendus au Manager principal", () => {
    const principal = makeUser("admin", "Manager principal");
    expect(filterCompteRendusForUser(entries, principal)).toHaveLength(3);
  });

  it("ne retourne rien sans utilisateur", () => {
    expect(filterCompteRendusForUser(entries, null)).toEqual([]);
  });
});
