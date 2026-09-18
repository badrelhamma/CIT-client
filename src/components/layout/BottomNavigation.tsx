import { useData } from "@/contexts/DataContext";
import { NAV_ITEMS, navGroupActive } from "./navigation";
import type { ScreenId } from "@/types";

interface BottomNavigationProps {
  active: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

export function BottomNavigation({ active, onNavigate }: BottomNavigationProps) {
  const { history } = useData();
  const historyCount = history.length;

  return (
    <nav
      aria-label="Navigation basse"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card md:hidden"
    >
      <div className="grid grid-cols-8">
        {NAV_ITEMS.map((item) => {
          const isActive = navGroupActive(item, active);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex cursor-pointer flex-col items-center gap-1 pt-2.5 pb-1.5 text-[10px] font-semibold transition-colors duration-150 ${
                isActive ? "text-adm-600" : "text-ink-faint"
              }`}
            >
              {item.id === "historique" && historyCount > 0 && (
                <span className="absolute top-1 right-[12%] flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[9px] font-bold text-white">
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