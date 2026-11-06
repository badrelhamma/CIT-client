import type { AuthUser, PermissionKey, ScreenId } from "@/types";

export const PRINCIPAL_ROLE = "Manager principal";

export function isPrincipal(user: AuthUser | null | undefined): boolean {
  return user?.role === PRINCIPAL_ROLE;
}

export function hasPermission(
  user: AuthUser | null | undefined,
  permission: PermissionKey,
): boolean {
  if (!user) return false;
  if (isPrincipal(user)) return true;
  return user.permissions.includes(permission);
}

export function canAddCompteRendu(
  user: AuthUser | null | undefined,
): boolean {
  if (!user || user.role === "Directeur") return false;
  return hasPermission(user, "page:compte-rendu");
}

const SCREEN_PERMISSIONS: Record<
  Exclude<ScreenId, "administration">,
  PermissionKey
> = {
  historique: "page:historique",
  historiqueTous: "page:historique",
  historiqueEncours: "page:historique",
  historiqueResolus: "page:historique",
  evenement: "page:evenement",
  repertoire: "page:repertoire",
  tmd: "page:tmd",
  criticite: "page:criticite",
  reseau: "page:reseau",
  compteRendu: "page:compte-rendu",
  listeCr: "page:compte-rendu",
  ajouterCr: "page:compte-rendu",
};

export function screenPermission(screen: ScreenId): PermissionKey | null {
  if (screen === "administration") return null;
  return SCREEN_PERMISSIONS[screen];
}

export function canAccessScreen(
  user: AuthUser | null | undefined,
  screen: ScreenId,
): boolean {
  if (!user) return false;
  if (screen === "administration") return isPrincipal(user);
  if (screen === "ajouterCr") return canAddCompteRendu(user);
  const permission = screenPermission(screen);
  return permission ? hasPermission(user, permission) : false;
}
