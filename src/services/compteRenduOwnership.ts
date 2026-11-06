import type { AuthUser } from "@/types";
import { isPrincipal } from "./access";

export interface CompteRenduOwnership {
  ownerId?: string;
  ownerName?: string;
  ownerIdentifier?: string;
}

export function filterCompteRendusForUser<T extends CompteRenduOwnership>(
  entries: T[],
  user: AuthUser | null | undefined,
): T[] {
  if (!user) return [];
  if (isPrincipal(user)) return entries;
  return entries.filter((entry) => entry.ownerId === user.id);
}
