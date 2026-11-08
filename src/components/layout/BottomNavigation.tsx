import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { navGroupActive, type NavItem } from "./navigation";
import type { ScreenId } from "@/types";

interface BottomNavigationProps {
  items: Omit<NavItem, "badge">[];
  active: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

const PRIMARY_IDS: ScreenId[] = [
  "historique",
  "evenement",
  "repertoire",
  "reseau",
];

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BottomNavigation({
  items,
  active,
  onNavigate,
}: BottomNavigationProps) {
  const { history } = useData();
  const historyCount = history.length;
  const [moreOpen, setMoreOpen] = useState(false);

  if (items.length === 0) return null;

  const primary = items.filter((i) => PRIMARY_IDS.includes(i.id));
  const secondary = items.filter((i) => !PRIMARY_IDS.includes(i.id));
  const showMore = secondary.length > 0;
  const moreActive = secondary.some((i) => navGroupActive(i, active));

  const visible = showMore ? primary : items;
  const cols = showMore ? visible.length + 1 : visible.length;

  const goto = (id: ScreenId) => {
    onNavigate(id);
    setMoreOpen(false);
  };

  return (
    <>
      {moreOpen && showMore && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Plus de rubriques"
          className="fixed inset-0 z-40 flex items-end justify-center md:hidden"
        >
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-[2px]"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="relative w-full max-w-lg rounded-t-3xl border border-line bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,.2)]"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
            <p className="px-1 pb-2 text-xs font-bold tracking-wide text-ink-faint uppercase">
              Plus de rubriques
            </p>
            <ul className="space-y-1">
              {secondary.map((item) => {
                const isActive = navGroupActive(item, active);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => goto(item.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                        isActive
                          ? "ig-gradient text-white"
                          : "text-ink hover:bg-card-2"
                      }`}
                    >
                      {item.icon}
                      <span className="min-w-0 flex-1 truncate text-left">
                        {item.label}
                      </span>
                      {isActive && (
                        <svg
                          aria-hidden="true"
                          className="size-4 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                    {(item.children ?? []).length > 0 && (
                      <ul className="mt-1 ml-8 space-y-0.5 border-l border-line-soft pl-3">
                        {(item.children ?? []).map((child) => {
                          const childActive = active === child.id;
                          return (
                            <li key={child.id}>
                              <button
                                type="button"
                                onClick={() => goto(child.id)}
                                aria-current={childActive ? "page" : undefined}
                                className={`flex min-h-10 w-full cursor-pointer items-center rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                                  childActive
                                    ? "ig-gradient text-white"
                                    : "text-ink-soft hover:bg-card-2 hover:text-ink"
                                }`}
                              >
                                {child.label}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <nav
        aria-label="Navigation basse"
        className="glass-bar fixed inset-x-0 bottom-0 z-30 max-w-full overflow-x-hidden md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className="mx-auto grid max-w-lg px-1 py-1.5"
          style={{
            gridTemplateColumns: `repeat(${Math.max(cols, 1)}, minmax(0, 1fr))`,
          }}
        >
          {visible.map((item) => {
            const isActive = navGroupActive(item, active);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goto(item.id)}
                aria-current={isActive ? "page" : undefined}
                title={item.label}
                className={`pressable relative flex min-h-[56px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full px-0.5 py-1.5 text-[10px] leading-tight font-semibold transition-colors duration-[180ms] ${
                  isActive ? "ig-gradient text-white" : "text-ink-faint hover:text-ink"
                }`}
              >
                {item.id === "historique" && historyCount > 0 && (
                  <span className="absolute top-1 left-[calc(50%+6px)] flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[9px] font-bold text-white">
                    {historyCount > 99 ? "99+" : historyCount}
                  </span>
                )}
                <span className="shrink-0 [&>svg]:size-5">{item.icon}</span>
                <span className="nav-label block max-w-full truncate">
                  {item.label}
                </span>
              </button>
            );
          })}
          {showMore && (
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              title="Plus de rubriques"
              className={`pressable relative flex min-h-[56px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full px-0.5 py-1.5 text-[10px] leading-tight font-semibold transition-colors duration-[180ms] ${
                moreActive || moreOpen
                  ? "ig-gradient text-white"
                  : "text-ink-faint hover:text-ink"
              }`}
            >
              {moreActive && (
                <span className="absolute top-2 right-1/2 translate-x-3 size-1.5 rounded-full bg-current" />
              )}
              <span className="shrink-0">
                <PlusIcon />
              </span>
              <span className="nav-label block max-w-full truncate">Plus</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
