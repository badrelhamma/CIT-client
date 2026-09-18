import { useState } from "react";
import { Badge } from "@/components/base/Badge";
import { Card } from "@/components/base/Card";
import { ErrorState } from "@/components/base/ErrorState";
import { LoadingState } from "@/components/base/LoadingState";
import { useData } from "@/contexts/DataContext";
import { hasCoords } from "@/services/geo";
import type { Highway } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  bifuraction: "Bifurcation",
  bifurcation: "Bifurcation",
  diffuseur: "Diffuseur",
  aire: "Aire",
  gare: "Gare / BPV",
};

const TYPE_TONES: Record<string, "adm" | "ok" | "warn" | "danger" | "neutral"> = {
  bifurcation: "neutral",
  diffuseur: "adm",
  aire: "ok",
  gare: "warn",
};

function formatKm(km: number): string {
  return km.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

export function NetworkScreen() {
  const {
    highways,
    catalogs,
    loadingHighways,
    loadingCatalogs,
    errorHighways,
    errorCatalogs,
  } = useData();
  const [expanded, setExpanded] = useState<string | null>(null);

  const stats = catalogs?.networkStats.data;
  const pending = catalogs?.pendingAxes.data ?? [];

  if (loadingHighways || loadingCatalogs) {
    return (
      <section aria-label="Réseau">
        <LoadingState label="Chargement du réseau..." />
      </section>
    );
  }
  if (errorHighways || errorCatalogs) {
    return (
      <section aria-label="Réseau">
        <ErrorState message={errorHighways ?? errorCatalogs ?? "Réseau indisponible."} />
      </section>
    );
  }

  const statCards: { label: string; value: string | number }[] = [
    { label: "Axes", value: stats?.highways ?? highways.length },
    { label: "Longueur totale", value: stats ? `${formatKm(stats.totalKm)} km` : "–" },
    { label: "Repères", value: stats?.landmarks ?? 0 },
    { label: "Axes en attente", value: stats?.pending ?? pending.length },
  ];

  return (
    <section aria-label="Réseau" className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <p className="text-2xl font-bold text-ink">Réseau autoroutier</p>
        <p className="text-ink-soft">
          Axes, repères et disponibilité GPS du réseau ADM.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="text-center">
            <p className="text-3xl font-bold text-adm-700 tabular-nums">
              {s.value}
            </p>
            <p className="text-sm font-medium text-ink-soft">
              {s.label}
            </p>
          </Card>
        ))}
      </div>

      {pending.length > 0 && (
        <Card className="mb-4 border-dashed">
          <h3 className="mb-3 text-base font-bold text-adm-700">
            Axes en attente d'intégration
          </h3>
          <div className="flex flex-wrap gap-2">
            {pending.map((p) => (
              <Badge key={p.id} tone="warn">
                {p.id} · {p.name}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {highways.map((h) => (
          <NetworkHighwayCard
            key={h.id}
            highway={h}
            expanded={expanded === h.id}
            onToggle={() => setExpanded(expanded === h.id ? null : h.id)}
          />
        ))}
      </div>
    </section>
  );
}

interface NetworkHighwayCardProps {
  highway: Highway;
  expanded: boolean;
  onToggle: () => void;
}

function NetworkHighwayCard({
  highway,
  expanded,
  onToggle,
}: NetworkHighwayCardProps) {
  const gps = hasCoords(highway.coords);
  const coordsCount = highway.coords?.length ?? 0;

  return (
    <Card padded={false}>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-adm-700 font-mono text-sm font-bold text-white">
            {highway.id}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-ink">{highway.name}</p>
            <p className="truncate text-xs text-ink-soft">
              {highway.origin} → {highway.end} · {highway.lengthKm} km ·{" "}
              {highway.landmarks.length} repères
            </p>
          </div>
        </div>
        <Badge tone={gps ? "ok" : "warn"} dot>
          {gps ? `${coordsCount} pts GPS` : "Sans GPS"}
        </Badge>
        <svg
          aria-hidden="true"
          className={`size-4 shrink-0 text-ink-faint transition-transform duration-150 ${
            expanded ? "rotate-180" : ""
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
      </button>

      {expanded && (
        <div className="border-t border-line px-4 py-3">
          <p className="mb-3 text-base font-bold text-adm-700">
            Sens
          </p>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Badge tone="adm">{highway.dirA}</Badge>
            <Badge tone="adm">{highway.dirB}</Badge>
          </div>

          <p className="mb-3 text-base font-bold text-adm-700">
            Repères kilométriques
          </p>
          <div className="max-h-80 overflow-y-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-paper text-xs font-bold text-adm-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">PK</th>
                  <th className="px-3 py-2 font-semibold">Repère</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                </tr>
              </thead>
              <tbody>
                {[...highway.landmarks]
                  .sort((a, b) => a.pk - b.pk)
                  .map((lm) => (
                    <tr
                      key={`${lm.pk}-${lm.name}`}
                      className="border-t border-line first:border-t-0"
                    >
                      <td className="px-3 py-1.5 font-mono tabular-nums">
                        {Math.floor(lm.pk / 1000)}+
                        {String(lm.pk % 1000).padStart(3, "0")}
                      </td>
                      <td className="px-3 py-1.5 font-medium text-ink">
                        {lm.name}
                      </td>
                      <td className="px-3 py-1.5">
                        <Badge tone={TYPE_TONES[lm.type] ?? "neutral"}>
                          {TYPE_LABELS[lm.type] ?? lm.type}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-ink-faint">
            {gps
              ? `Coordonnées GPS disponibles (${coordsCount} points) pour la localisation d'événements.`
              : "GPS indisponible — la position d'un événement ne sera pas calculée pour cet axe."}
          </p>
        </div>
      )}

      </Card>
  );
}