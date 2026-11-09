import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { SystemStatus } from "./SystemStatus";
import { ThemeToggle } from "./ThemeToggle";

function formatKm(total: number): string {
  return total.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

function initials(name: string): string {
  return (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function HeaderClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="material-regular tabular-nums inline-flex items-center gap-1.5 rounded-full border border-line-soft px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-ink shadow-sm sm:px-3.5">
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-ok" />
      {now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  );
}

export function Header() {
  const { highways, catalogs } = useData();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const axes = highways.length;
  const stats = catalogs?.networkStats?.data;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="glass-bar sticky top-0 z-30 max-w-full overflow-x-hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src="/LogoCIT.png"
            alt="Logo CIT"
            width={40}
            height={40}
            className="size-9 shrink-0 rounded-[22%] object-cover shadow-[0_2px_10px_rgba(0,0,0,0.25)] sm:size-10"
          />
          <div className="min-w-0">
            <h1 className="font-display text-lg leading-none text-ink sm:text-xl">
              CIT
            </h1>
            <p className="mt-1 hidden truncate text-xs text-ink-faint tabular-nums sm:block">
              ADM · {axes} axes · {stats ? formatKm(stats.totalKm) : "–"} km ·{" "}
              {stats ? stats.landmarks : "–"} repères
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {user && (
            <div className="flex items-center gap-1.5 border-l border-line-soft pl-1.5 sm:pl-2">
              <div className="ig-story shrink-0">
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full bg-card-2 text-xs font-bold text-ink"
                >
                  {initials(user.name)}
                </span>
              </div>
              <div className="hidden max-w-36 text-right lg:block">
                <p className="truncate text-xs font-bold text-ink">
                  {user.name}
                </p>
                <p className="truncate text-[10px] text-ink-faint">
                  {user.role}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                title={`Se déconnecter (${user.name})`}
                aria-label={`Se déconnecter (${user.name})`}
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-adm-50 hover:text-adm-700 disabled:cursor-wait disabled:opacity-50"
              >
                {loggingOut ? (
                  <svg
                    aria-hidden="true"
                    className="size-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="m16 17 5-5-5-5" />
                    <path d="M21 12H9" />
                  </svg>
                )}
              </button>
            </div>
          )}
          <HeaderClock />
          <ThemeToggle />
          <SystemStatus />
        </div>
      </div>
    </header>
  );
}
