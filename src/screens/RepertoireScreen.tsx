import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/base/Badge";
import { Button } from "@/components/base/Button";
import { Card } from "@/components/base/Card";
import { EmptyState } from "@/components/base/EmptyState";
import { ErrorState } from "@/components/base/ErrorState";
import { Field } from "@/components/base/Field";
import { LoadingState } from "@/components/base/LoadingState";
import { api } from "@/services/api";
import { normalize, metierKey, selectCls, inputCls } from "./repertoireUi";
import type { DirectoryEntry, Highway } from "@/types";

function matchesZone(item: DirectoryEntry, axe: string, pkText: string): boolean {
  const zones = item.zones ?? [];
  if (!axe && !pkText) return true;
  const pk = pkText === "" ? null : Number(pkText);
  return zones.some((z) => {
    if (axe && z.axe !== axe) return false;
    if (pk === null) return true;
    if (Number.isNaN(z.pkd) || Number.isNaN(z.pkf)) return false;
    return pk >= Math.min(z.pkd, z.pkf) && pk <= Math.max(z.pkd, z.pkf);
  });
}

function useDirectory() {
  const [directory, setDirectory] = useState<DirectoryEntry[]>([]);
  const [highways, setHighways] = useState<Highway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([api.directory(), api.highways()])
      .then(([dir, hw]) => {
        if (alive) {
          setDirectory(dir);
          setHighways(hw);
        }
      })
      .catch(() => {
        if (alive) setError("Impossible de charger le répertoire.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const metiers = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of directory) {
      const k = metierKey(d.metier);
      if (!k) continue;
      if (!map.has(k) || d.metier.trim().length < (map.get(k) ?? "").length) {
        map.set(k, d.metier.trim().replace(/,$/, "") || d.metier.trim());
      }
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "fr"));
  }, [directory]);

  const zones = useMemo(
    () =>
      highways.flatMap((h) =>
        (h.zones ?? []).map((z) => ({ axe: h.id, ...z })),
      ),
    [highways],
  );

  const regions = useMemo(
    () =>
      Array.from(new Set(zones.map((z) => z.region).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "fr"),
      ),
    [zones],
  );

  return { directory, loading, error, metiers, regions, zones };
}

export function RepertoireScreen() {
  const { directory, loading, error, metiers, regions, zones } = useDirectory();

  const [search, setSearch] = useState("");
  const [metier, setMetier] = useState("");
  const [region, setRegion] = useState("");
  const [axe, setAxe] = useState("");
  const [pk, setPk] = useState("");

  const regionAxes = useMemo(() => {
    const candidates = region
      ? zones.filter((z) => z.region === region).map((z) => z.axe)
      : zones.map((z) => z.axe);
    return Array.from(new Set(candidates)).sort((a, b) => a.localeCompare(b, "fr"));
  }, [zones, region]);

  const currentZone = useMemo(() => {
    const matches = zones.filter(
      (z) => z.axe === axe && (!region || z.region === region),
    );
    return matches.length ? matches[0] : null;
  }, [zones, axe, region]);

  const pkNum = pk === "" ? null : Number(pk);
  const pkOutOfRange =
    currentZone &&
    pkNum !== null &&
    !Number.isNaN(pkNum) &&
    (pkNum < Math.min(currentZone.pkd, currentZone.pkf) ||
      pkNum > Math.max(currentZone.pkd, currentZone.pkf));

  function handleRegionChange(value: string) {
    setRegion(value);
    if (value && axe && !zones.some((z) => z.region === value && z.axe === axe)) {
      setAxe("");
    }
  }

  const filtered = useMemo(() => {
    const needle = normalize(search);
    return directory.filter((item) => {
      if (region && item.region !== region) return false;
      if (metier && metierKey(item.metier) !== metierKey(metier)) return false;
      if (!matchesZone(item, axe, pk)) return false;
      if (needle) {
        const zoneText = (item.zones ?? [])
          .map((z) => [z.axe, z.pkd, z.pkf].join(" "))
          .join(" ");
        const hay = normalize(
          [
            item.region,
            item.nom,
            item.telephone,
            item.metier,
            item.troncon,
            zoneText,
          ].join(" "),
        );
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [directory, search, metier, region, axe, pk]);

  function reset() {
    setSearch("");
    setMetier("");
    setRegion("");
    setAxe("");
    setPk("");
  }

  return (
    <section aria-label="Répertoire opérationnel" className="mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <p className="font-display text-3xl text-ink">Répertoire opérationnel</p>
        <p className="mt-1 text-base text-ink-soft">
          Contacts opérationnels par région, axe et PK. Les régions, axes et
          plages de PK proviennent de la base axes commune (page Recherche).
        </p>
      </div>

      <Card className="border-t-4 border-t-adm-600">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <Field label="Recherche libre">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom, téléphone, métier..."
                className={inputCls}
              />
            </Field>
          </div>
          <div>
            <Field label="Métier">
              <select
                value={metier}
                onChange={(e) => setMetier(e.target.value)}
                className={selectCls}
              >
                <option value="">Tous les métiers</option>
                {metiers.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div>
            <Field label="Région">
              <select
                value={region}
                onChange={(e) => handleRegionChange(e.target.value)}
                className={selectCls}
              >
                <option value="">Toutes</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div>
            <Field label="Axe">
              <select
                value={axe}
                onChange={(e) => setAxe(e.target.value)}
                className={selectCls}
              >
                <option value="">Tous</option>
                {regionAxes.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div>
            <Field label="PK">
              <input
                type="number"
                step="0.1"
                value={pk}
                onChange={(e) => setPk(e.target.value)}
                placeholder={
                  currentZone
                    ? `PK ${Math.min(currentZone.pkd, currentZone.pkf)} à ${Math.max(
                        currentZone.pkd,
                        currentZone.pkf,
                      )}`
                    : "Ex. 120"
                }
                className={inputCls}
              />
              {currentZone && (
                <p
                  className={
                    pkOutOfRange
                      ? "mt-1 text-xs font-semibold text-red"
                      : "mt-1 text-xs text-ink-faint"
                  }
                >
                  Axe {currentZone.axe} · {currentZone.region} : PK{" "}
                  {Math.min(currentZone.pkd, currentZone.pkf)} à{" "}
                  {Math.max(currentZone.pkd, currentZone.pkf)}
                  {pkOutOfRange ? " — hors plage pour cette zone." : ""}
                </p>
              )}
            </Field>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="adm">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </Badge>
          {metier && <Badge tone="ok">{metier}</Badge>}
          <Button variant="secondary" size="sm" onClick={reset} className="ml-auto">
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
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Réinitialiser
          </Button>
        </div>

        {loading && <LoadingState label="Chargement du répertoire..." />}
        {!loading && error && (
          <div className="mt-4">
            <ErrorState message={error} />
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="Aucun contact"
              description="Aucun contact ne correspond aux critères sélectionnés."
            />
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {filtered.map((item) => {
              const tel = item.telephone?.trim();
              const telHref = (item.telephone ?? "").replace(/[^0-9+]/g, "");
              const zones = item.zones?.length ? item.zones : null;
              return (
                <article
                  key={item.nom + item.telephone + item.troncon}
                  className="rounded-lg border border-line bg-card p-3.5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-bold text-ink">{item.nom}</p>
                    {item.region && <Badge tone="warn">{item.region}</Badge>}
                  </div>
                  <p className="mt-1 text-sm font-bold text-ok">
                    {tel ? (
                      <a
                        href={`tel:${telHref}`}
                        className="text-ok no-underline hover:underline"
                      >
                        {tel}
                      </a>
                    ) : (
                      "Téléphone non renseigné"
                    )}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    <b>Métier :</b> {item.metier?.trim() || "—"}
                  </p>
                  <p className="text-xs leading-relaxed text-ink-soft">
                    <b>Tronçon :</b> {item.troncon?.trim() || "—"}
                  </p>
                  {zones && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {zones.map((z) => (
                        <span
                          key={`${z.axe}-${z.pkd}-${z.pkf}`}
                          className="rounded-full bg-adm-50 px-2 py-0.5 text-xs font-bold text-adm-700"
                        >
                          {z.axe} — PK {z.pkd} à {z.pkf}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}