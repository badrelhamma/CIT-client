import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNavigation } from "./BottomNavigation";
import {
  NAV_ITEMS,
  filterNavForUser,
  firstAccessibleScreen,
} from "./navigation";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessScreen } from "@/services/access";
import type { ScreenId } from "@/types";

interface AppShellProps {
  children: (screen: ScreenId, navigate: (s: ScreenId) => void) => ReactNode;
}

/** Titre d'onglet du navigateur : Historique (page d'accueil) → « CIT » seul. */
function screenTitle(screen: ScreenId): string {
  if (screen === "historique" || screen.startsWith("historique")) return "CIT";
  for (const item of NAV_ITEMS) {
    if (item.id === screen) return item.label;
    const child = (item.children ?? []).find((c) => c.id === screen);
    if (child) return child.label;
  }
  return "CIT";
}

const VALID_SCREENS: ScreenId[] = [
  "evenement",
  "historique",
  "historiqueTous",
  "historiqueEncours",
  "historiqueResolus",
  "reseau",
  "repertoire",
  "tmd",
  "criticite",
  "compteRendu",
  "listeCr",
  "ajouterCr",
  "administration",
];

function storageKey(userId?: string | null): string {
  return userId ? `cit:screen:${userId}` : "cit:screen";
}

function readStoredScreen(userId?: string | null): ScreenId | null {
  try {
    const raw =
      localStorage.getItem(storageKey(userId)) ?? localStorage.getItem("cit:screen");
    if (raw && (VALID_SCREENS as string[]).includes(raw)) return raw as ScreenId;
  } catch {
    /* stockage indisponible */
  }
  return null;
}

function writeStoredScreen(screen: ScreenId, userId?: string | null) {
  try {
    localStorage.setItem(storageKey(userId), screen);
    localStorage.setItem("cit:screen", screen);
  } catch {
    /* stockage indisponible */
  }
}

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuth();
  const userId = (user as { id?: string } | null)?.id ?? null;
  const [screen, setScreen] = useState<ScreenId>(() => {
    const stored = readStoredScreen(userId);
    if (stored && canAccessScreen(user, stored)) return stored;
    return firstAccessibleScreen(user) ?? "administration";
  });

  const navItems = useMemo(() => filterNavForUser(user), [user]);
  const allowed = canAccessScreen(user, screen);

  useEffect(() => {
    const stored = readStoredScreen(userId);
    if (stored && stored !== screen && canAccessScreen(user, stored)) {
      setScreen(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!canAccessScreen(user, screen)) {
      const next = firstAccessibleScreen(user);
      if (next) setScreen(next);
    }
  }, [user, screen]);

  useEffect(() => {
    writeStoredScreen(screen, userId);
  }, [screen, userId]);

  useEffect(() => {
    document.title = screenTitle(screen);
  }, [screen]);

  const navigate = (s: ScreenId) => {
    if (canAccessScreen(user, s)) setScreen(s);
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-paper">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-1 items-stretch">
        <Sidebar items={navItems} active={screen} onNavigate={navigate} />
        <main className="min-w-0 flex-1 px-3 pt-4 pb-28 sm:px-6 sm:pt-6 md:pb-8">
          {navItems.length === 0 ? (
            <div className="mx-auto mt-16 max-w-md rounded-[var(--radius-card)] border border-line bg-card p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,.08)]">
              <p className="font-display text-2xl text-ink">
                Aucune page autorisée
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Aucune permission ne vous a encore été accordée. Contactez votre
                Manager principal.
              </p>
            </div>
          ) : allowed ? (
            children(screen, navigate)
          ) : (
            <div className="mx-auto mt-16 max-w-md rounded-[var(--radius-card)] border border-line bg-card p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,.08)]">
              <p className="font-display text-2xl text-ink">Accès non autorisé</p>
              <p className="mt-2 text-sm text-ink-soft">
                Cette page ne fait pas partie de vos permissions.
              </p>
            </div>
          )}
        </main>
      </div>
      <BottomNavigation
        items={navItems}
        active={screen}
        onNavigate={navigate}
      />
    </div>
  );
}