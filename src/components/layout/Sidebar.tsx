import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { NAV_ITEMS, navGroupActive, type NavItem } from "./navigation";
import type { ScreenId } from "@/types";

interface SidebarProps {
  active: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  const { history } = useData();
  const historyCount = history.length;

  const [expanded, setExpanded] = useState<ScreenId | null>(() => {
    const parent = NAV_ITEMS.find((item) =>
      (item.children ?? []).some((child) => child.id === active),
    );
    return parent?.id ?? null;
  });

  function renderItem(item: NavItem) {
    const isActive = navGroupActive(item, active);
    const badge = item.id === "historique" ? historyCount : undefined;
    const hasChildren = (item.children ?? []).length > 0;
    const isOpen = expanded === item.id;

    return (
      <div key={item.id}>
        <button
          type="button"
          onClick={() =>
            hasChildren
              ? setExpanded(isOpen ? null : item.id)
              : onNavigate(item.id)
          }
          aria-expanded={hasChildren ? isOpen : undefined}
          aria-current={isActive ? "page" : undefined}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-150 ${
            isActive
              ? "bg-adm-700 text-white"
              : "text-ink-soft hover:bg-adm-50 hover:text-ink"
          }`}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          {hasChildren && (
            <svg
              aria-hidden="true"
              className={`size-4 transition-transform duration-150 ${
                isOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
          {badge !== undefined && badge > 0 && (
            <span
              className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums ${
                isActive ? "bg-white/20 text-white" : "bg-adm-100 text-adm-700"
              }`}
            >
              {badge}
            </span>
          )}
        </button>

        {hasChildren && isOpen && (
          <div className="mt-1 ml-5 space-y-1 border-l-2 border-adm-200 pl-3">
            {(item.children ?? []).map((child) => {
              const childActive = active === child.id;
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => onNavigate(child.id)}
                  aria-current={childActive ? "page" : undefined}
                  className={`flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150 ${
                    childActive
                      ? "bg-adm-700 text-white"
                      : "text-ink-soft hover:bg-adm-50 hover:text-ink"
                  }`}
                >
                  <span className="flex-1 text-left">{child.label}</span>
                  {childActive && (
                    <svg
                      aria-hidden="true"
                      className="size-4"
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
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-card md:flex">
      <nav
        aria-label="Navigation principale"
        className="flex flex-col gap-1.5 p-4"
      >
        {NAV_ITEMS.map(renderItem)}
      </nav>

      <div className="mt-auto border-t border-line p-4">
        <p className="text-[11px] leading-relaxed text-ink-faint">
          Dev Badr El Hamma
          <br />
          Le content manager : Ait Brahim
        </p>
      </div>
    </aside>
  );
}