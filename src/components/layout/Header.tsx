import { useEffect, useState } from "react";
import { useData } from "@/contexts/DataContext";
import { SystemStatus } from "./SystemStatus";

function formatKm(total: number): string {
  return total.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

function HeaderClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-bold text-ink tabular-nums">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-ok" />
      {now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  );
}

export function Header() {
  const { highways, catalogs } = useData();

  const axes = highways.length;
  const stats = catalogs?.networkStats.data;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-[2px]"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-card font-display text-sm text-adm-600">
              CIT
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl leading-none text-ink">
              CIT
            </h1>
            <p className="mt-1 truncate text-xs text-ink-faint tabular-nums">
              ADM · {axes} axes · {stats ? formatKm(stats.totalKm) : "–"} km ·{" "}
              {stats ? stats.landmarks : "–"} repères
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HeaderClock />
          <SystemStatus />
        </div>
      </div>
    </header>
  );
}