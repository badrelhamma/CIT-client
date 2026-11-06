import { useData } from "@/contexts/DataContext";
import { navGroupActive, type NavItem } from "./navigation";
import type { ScreenId } from "@/types";

interface BottomNavigationProps {
  items: Omit<NavItem, "badge">[];
  active: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

export function BottomNavigation({
  items,
  active,
  onNavigate,
}: BottomNavigationProps) {
  const { history } = useData();
  const historyCount = history.length;

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Navigation basse"
      className="fixed inset-x-3 z-30 md:hidden"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="glass-dock mx-auto grid max-w-lg rounded-[var(--radius-card)] p-1.5"
        style={{
          gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => {
          const isActive = navGroupActive(item, active);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`pressable relative flex cursor-pointer flex-col items-center gap-0.5 rounded-2xl px-1 pt-2 pb-1.5 text-[10px] font-semibold transition-colors duration-150 ${
                isActive ? "tint-fill" : "text-ink-faint"
              }`}
            >
              {item.id === "historique" && historyCount > 0 && (
                <span className="absolute top-1 left-[calc(50%+6px)] flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[9px] font-bold text-white">
                  {historyCount}
                </span>
              )}
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
