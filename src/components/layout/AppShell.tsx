import { useEffect, useState, type ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNavigation } from "./BottomNavigation";
import { NAV_ITEMS } from "./navigation";
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

export function AppShell({ children }: AppShellProps) {
  const [screen, setScreen] = useState<ScreenId>("historique");

  useEffect(() => {
    document.title = screenTitle(screen);
  }, [screen]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  const navigate = (s: ScreenId) => setScreen(s);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-1 items-stretch">
        <Sidebar active={screen} onNavigate={navigate} />
        <main className="min-w-0 flex-1 px-4 pt-6 pb-24 sm:px-6 md:pb-8">
          {children(screen, navigate)}
        </main>
      </div>
      <BottomNavigation active={screen} onNavigate={navigate} />
    </div>
  );
}