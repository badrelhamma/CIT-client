import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/base/Badge";
import { Button } from "@/components/base/Button";
import { Card } from "@/components/base/Card";
import { EmptyState } from "@/components/base/EmptyState";
import { ErrorState } from "@/components/base/ErrorState";
import { LoadingState } from "@/components/base/LoadingState";
import { MessageText } from "@/components/base/MessageText";
import { PkSign } from "@/components/base/PkSign";
import { PkRangeSlider } from "@/components/base/PkRangeSlider";
import { ReplyDialog } from "@/components/history/ReplyDialog";
import { Dialog } from "@/components/base/Dialog";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/services/api";
import { exportHistoryPdf } from "@/services/historyPdf";
import { exportHistoryExcel } from "@/services/historyExcel";
import { formatPk, formatPkKm } from "@/services/location";
import { copyText, waShareUrl } from "@/services/share";
import type { HistoryEvent, HistoryReply } from "@/types";

export type HistoryFeedTab = "tous" | "encours" | "resolus";

const TAB_SUBTITLE: Record<HistoryFeedTab, string> = {
  tous: "tous les événements",
  encours: "événements en cours",
  resolus: "événements résolus",
};

/* Nombre d'événements par page. */
const PAGE_SIZE = 10;

/* Bornes du slider de plage PK (en km). */
const PK_MIN = 0;
const PK_MAX = 500;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function colorLabel(colorId: string): string {
  const map: Record<string, string> = {
    jaune: "Jaune",
    orange: "Orange",
    rouge: "Rouge",
  };
  return map[colorId] ?? colorId;
}

/* ————— Icônes (style trait) ————— */

function IconChevron({ dir }: { dir: "up" | "down" }) {
  return (
    <svg aria-hidden="true" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {dir === "up" ? <path d="m18 15-6-6-6 6" /> : <path d="m6 9 6 6 6-6" />}
    </svg>
  );
}

function IconDownload() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function IconReply() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3a8.38 8.38 0 0 1 8.5 8.5Z" />
      <path d="m9.5 9.5 5 5" />
      <path d="m14.5 9.5-5 5" />
    </svg>
  );
}

function IconDetail() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h10" />
    </svg>
  );
}

function IconReopen() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function IconNormal() {
  return (
    <svg aria-hidden="true" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const ACTION =
  "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-adm-50 hover:text-adm-600";

interface HistoryScreenProps {
  initialTab?: HistoryFeedTab;
}

export function HistoryScreen({ initialTab = "tous" }: HistoryScreenProps) {
  const {
    highways,
    catalogs,
    history,
    loadingHistory,
    errorHistory,
    refreshHistory,
  } = useData();
  const { notify } = useToast();

  const feedTab = initialTab;
  const [textSearch, setTextSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pkMinKm, setPkMinKm] = useState(PK_MIN);
  const [pkMaxKm, setPkMaxKm] = useState(PK_MAX);
  const [filterHighway, setFilterHighway] = useState("");
  const [page, setPage] = useState(1);
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<HistoryEvent | null>(null);

  useEffect(() => {
    setPage(1);
  }, [feedTab, dateFrom, dateTo, textSearch, filterHighway, pkMinKm, pkMaxKm]);

  function typeLabel(e: HistoryEvent) {
    return (
      catalogs?.requestTypes.data.find((t) => t.id === e.typeId)?.label ??
      e.typeId
    );
  }

  function sourceLabels(e: HistoryEvent) {
    return e.sourceIds
      .map(
        (id) =>
          catalogs?.detectionSources.data.find((s) => s.id === id)?.label ?? id,
      )
      .join(", ");
  }

  function colorHex(id: string) {
    return catalogs?.eventColors.data.find((c) => c.id === id)?.hex ?? "#7c8ea3";
  }

  function highwayOf(id: string) {
    return highways.find((h) => h.id === id);
  }

  const repliesByRef = useMemo(() => {
    const map: Record<string, (HistoryReply | HistoryEvent)[]> = {};
    for (const ev of history) {
      if (ev.replies && ev.replies.length > 0) {
        (map[ev.refCode] ??= []).push(...ev.replies);
      }
      if (ev.replyTo) {
        (map[ev.replyTo] ??= []).push(ev);
      }
    }
    for (const key of Object.keys(map)) {
      map[key] = map[key].sort((a, b) => b.at.localeCompare(a.at));
    }
    return map;
  }, [history]);

  const dateFromTs = dateFrom ? `${dateFrom}T00:00:00.000Z` : null;
  const dateToTs = dateTo ? `${dateTo}T23:59:59.999Z` : null;

  /* Événements racines, filtrés par flux, recherche et période. */
  const filtered = useMemo(() => {
    const needle = textSearch.trim().toLowerCase();
    return history
      .filter((e) => e.replyTo === null)
      .filter((e) => {
        if (feedTab === "encours" && e.resolved) return false;
        if (feedTab === "resolus" && !e.resolved) return false;
        if (dateFromTs && e.at < dateFromTs) return false;
        if (dateToTs && e.at > dateToTs) return false;
        if (e.pk < pkMinKm * 1000) return false;
        if (e.pk > pkMaxKm * 1000) return false;
        if (filterHighway && e.highway !== filterHighway) return false;
        if (needle) {
          const hay = [
            e.message,
            e.refCode,
            e.highway,
            formatPk(e.pk),
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => b.at.localeCompare(a.at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, feedTab, dateFrom, dateTo, textSearch, filterHighway, pkMinKm, pkMaxKm]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered],
  );

  const safePage = Math.min(page, pageCount);

  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  const reportCtx = useMemo(
    () => ({
      typeLabel: (id: string) =>
        catalogs?.requestTypes.data.find((t) => t.id === id)?.label ?? id,
      statusLabel: (id: string) =>
        catalogs?.statuses.data.find((s) => s.id === id)?.label ?? id,
      colorLabel: (id: string) => colorLabel(id),
      colorHex: (id: string) => colorHex(id),
      highwayLabel: (id: string) => {
        const hw = highways.find((h) => h.id === id);
        return hw ? `${hw.id} — ${hw.name}` : id;
      },
      sourceLabel: (e: HistoryEvent) => sourceLabels(e),
      bilanTemplates: catalogs?.bilanTypeTemplates.data ?? [],
    }),
    [catalogs, highways],
  );

  function handleExportPdf() {
    if (filtered.length === 0) {
      notify("Aucun événement à exporter.", "info");
      return;
    }
    exportHistoryPdf(filtered, "date-axe", reportCtx);
    notify("Historique exporté au format PDF.", "ok");
  }

  async function handleExportExcel() {
    if (filtered.length === 0) {
      notify("Aucun événement à exporter.", "info");
      return;
    }
    try {
      await exportHistoryExcel(filtered, reportCtx);
      notify("Historique exporté au format Excel.", "ok");
    } catch {
      notify("Export Excel impossible.", "error");
    }
  }

  async function toggleResolved(e: HistoryEvent) {
    try {
      await api.updateHistory(e.id, { resolved: !e.resolved });
      await refreshHistory();
      notify(e.resolved ? "Événement rouvert." : "Événement résolu.", "ok");
    } catch {
      notify("Mise à jour impossible.", "error");
    }
  }

  function buildNormalMessage(e: HistoryEvent): string {
    return `✅ *Retour à la normale*\n*Trafic rétabli sur ${e.highway} / PK ${formatPkKm(e.pk)}*`;
  }

  async function handleNormal(e: HistoryEvent) {
    if (
      !window.confirm(
        "Retour à la normale ?\nLe statut passera à « Clôture ».",
      )
    )
      return;
    try {
      await api.updateHistory(e.id, {
        statusId: "cloture",
        resolved: true,
        message: buildNormalMessage(e),
      });
      await refreshHistory();
      notify(`Événement ${e.refCode} clôturé (retour à la normale).`, "ok");
    } catch {
      notify("Mise à jour impossible.", "error");
    }
  }

  return (
    <section aria-label="Historique" className="mx-auto w-full max-w-6xl">
      <h2 className="sr-only">Historique des événements</h2>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-bold text-ink">
            Historique des événements — CIT
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {filtered.length} événement{filtered.length > 1 ? "s" : ""} —{" "}
            {TAB_SUBTITLE[feedTab]}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex min-w-0 flex-1 items-center sm:w-80">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint">
              <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></svg>
            </span>
            <input
              type="search"
              value={textSearch}
              onChange={(e) => setTextSearch(e.target.value)}
              placeholder="Message, référence, PK, axe…"
              className="w-full rounded-xl border border-line bg-card py-2.5 pr-12 pl-10 text-base text-ink shadow-sm transition-colors focus:border-adm-500 focus:outline-none"
            />
            <button
              type="button"
              title={(dateFrom || dateTo || filterHighway || pkMinKm > PK_MIN || pkMaxKm < PK_MAX) ? "Filtres actifs — ouvrir" : "Recherche & filtres"}
              onClick={() => setSearchOpen(true)}
              className={`absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                dateFrom || dateTo || filterHighway || pkMinKm > PK_MIN || pkMaxKm < PK_MAX
                  ? "bg-adm-600 text-white hover:bg-adm-700"
                  : "text-ink-faint hover:bg-adm-50 hover:text-adm-600"
              }`}
            >
              <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <Dialog
          title="Recherche & filtres"
          onClose={() => setSearchOpen(false)}
          maxWidth="max-w-2xl"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="relative block">
              <span className="mb-1 block text-sm font-semibold text-ink-soft">
                Date début
              </span>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-base text-ink shadow-sm transition-colors focus:border-adm-500 focus:outline-none"
              />
            </label>
            <label className="relative block">
              <span className="mb-1 block text-sm font-semibold text-ink-soft">
                Date fin
              </span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-base text-ink shadow-sm transition-colors focus:border-adm-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-ink-soft">
                Axe
              </span>
              <div className="relative">
                <select
                  aria-label="Axe"
                  value={filterHighway}
                  onChange={(e) => setFilterHighway(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-line bg-card py-2.5 pr-9 pl-3.5 text-base text-ink shadow-sm transition-colors focus:border-adm-500 focus:outline-none"
                >
                  <option value="">Tous les axes</option>
                  {highways.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.id} · {h.name}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-faint"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </label>
          </div>

          <div className="mt-3">
            <span className="mb-1 block text-sm font-semibold text-ink-soft">
              Plage PK
            </span>
            <PkRangeSlider
              minKm={PK_MIN}
              maxKm={PK_MAX}
              fromKm={pkMinKm}
              toKm={pkMaxKm}
              onChange={(from, to) => {
                setPkMinKm(from);
                setPkMaxKm(to);
              }}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <span className="mr-1 text-sm font-semibold text-ink-soft">
              Export
            </span>
            <Button variant="secondary" size="sm" onClick={handleExportExcel}>
              <IconDownload />
              Excel (.xlsx)
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportPdf}>
              <IconDownload />
              PDF
            </Button>
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setFilterHighway("");
                setPkMinKm(PK_MIN);
                setPkMaxKm(PK_MAX);
              }}
              disabled={
                !dateFrom &&
                !dateTo &&
                !filterHighway &&
                pkMinKm === PK_MIN &&
                pkMaxKm === PK_MAX
              }
            >
              Réinitialiser
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="ml-auto"
              onClick={() => setSearchOpen(false)}
            >
              Appliquer
            </Button>
          </div>
        </Dialog>
      )}

      {loadingHistory && (
        <Card className="mt-3 border-t-4 border-t-adm-600">
          <LoadingState label="Chargement de l'historique..." />
        </Card>
      )}

      {!loadingHistory && errorHistory && (
        <Card className="mt-3 border-t-4 border-t-adm-600">
          <ErrorState
            message={errorHistory}
            onRetry={() => void refreshHistory()}
          />
        </Card>
      )}

      {!loadingHistory && !errorHistory && filtered.length === 0 && (
        <Card className="mt-3 border-t-4 border-t-adm-600">
          <EmptyState
            title="Aucun événement"
            description="Les événements enregistrés correspondant aux filtres apparaîtront ici."
          />
        </Card>
      )}

      {!loadingHistory &&
        !errorHistory &&
        filtered.length > 0 &&
        pageItems.length > 0 && (
          <>
            <Card className="mt-3 border-t-4 border-t-adm-600">
              <ul className="grid gap-3">
                {pageItems.map((e) => {
                  const detailOpen = openDetailId === e.id;
                  const mods = repliesByRef[e.refCode] ?? [];
                  return (
                    <HistoryCard
                      key={e.id}
                      event={e}
                      detailOpen={detailOpen}
                      mods={mods}
                      onToggleDetail={() =>
                        setOpenDetailId(detailOpen ? null : e.id)
                      }
                      onReply={() => setReplyTarget(e)}
                      onToggleResolved={() => void toggleResolved(e)}
                      onNormal={() => void handleNormal(e)}
                      onCopy={() => {
                        void copyText(e.message).then(() =>
                          notify("Message copié.", "ok"),
                        );
                      }}
                      typeLabel={typeLabel(e)}
                      sourceLabel={sourceLabels(e)}
                      colorHex={colorHex(e.color)}
                      highwayName={highwayOf(e.highway)?.name}
                    />
                  );
                })}
              </ul>
            </Card>

            <nav
              aria-label="Pagination de l'historique"
              className="mt-5 flex flex-col items-center gap-2"
            >
              <p className="text-xs tracking-wide text-ink-faint tabular-nums">
                {pageStart}–{pageEnd} sur {filtered.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Page précédente"
                  disabled={safePage === 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0 });
                  }}
                  className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-line bg-card px-3 text-sm font-semibold text-ink shadow-xs transition-colors hover:bg-adm-50 hover:text-adm-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ←
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-current={n === safePage ? "page" : undefined}
                    onClick={() => {
                      setPage(n);
                      window.scrollTo({ top: 0 });
                    }}
                    className={`inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      n === safePage
                        ? "bg-adm-700 text-white"
                        : "border border-line bg-card text-ink-soft shadow-xs hover:bg-adm-50 hover:text-adm-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Page suivante"
                  disabled={safePage === pageCount}
                  onClick={() => {
                    setPage((p) => Math.min(pageCount, p + 1));
                    window.scrollTo({ top: 0 });
                  }}
                  className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-line bg-card px-3 text-sm font-semibold text-ink shadow-xs transition-colors hover:bg-adm-50 hover:text-adm-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  →
                </button>
              </div>
            </nav>
          </>
        )}

      {replyTarget && catalogs && (
        <ReplyDialog
          event={replyTarget}
          catalogs={catalogs}
          onClose={() => setReplyTarget(null)}
          onSaved={refreshHistory}
        />
      )}
    </section>
  );
}

/* ————— Carte d'événement ————— */

interface HistoryCardProps {
  event: HistoryEvent;
  detailOpen: boolean;
  mods: (HistoryReply | HistoryEvent)[];
  onToggleDetail: () => void;
  onReply: () => void;
  onToggleResolved: () => void;
  onNormal: () => void;
  onCopy: () => void;
  typeLabel: string;
  sourceLabel: string;
  colorHex: string;
  highwayName?: string;
}

function badgeFor(e: HistoryEvent): { label: string; tone: "ok" | "neutral" | "adm" } {
  if (e.statusId === "cloture") return { label: "Clôture", tone: "ok" };
  if (e.resolved) return { label: "Résolu", tone: "ok" };
  return { label: "En cours", tone: "neutral" };
}

function HistoryCard({
  event: e,
  detailOpen,
  mods,
  onToggleDetail,
  onReply,
  onToggleResolved,
  onNormal,
  onCopy,
  typeLabel: typeText,
  sourceLabel,
  colorHex,
  highwayName,
}: HistoryCardProps) {
  const badge = badgeFor(e);
  return (
    <li
      className="break-inside-avoid rounded-lg border border-line bg-card p-3.5 shadow-sm"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: colorHex,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <PkSign axe={e.highway} pk={formatPk(e.pk)} />
          <div className="min-w-0">
            <p className="text-base leading-tight font-bold text-ink">
              {highwayName ? `${e.highway} — ${highwayName}` : e.highway}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
              {e.direction || "—"}
              {typeText ? ` · ${typeText}` : ""}
            </p>
          </div>
        </div>
        <Badge tone={badge.tone} dot>
          {badge.label}
        </Badge>
      </div>

      <p className="mt-2 text-[11px] tracking-wide text-ink-faint">
        {formatDate(e.at)} ·{" "}
        <span className="font-mono font-bold text-adm-700">{e.refCode}</span>
        {e.color && (
          <>
            {" "}
            · <span className="font-semibold italic">{colorLabel(e.color)}</span>
          </>
        )}
      </p>

      <div className="mt-1.5">
        <MessageText text={e.message} />
      </div>

      {sourceLabel && (
        <p className="mt-1 text-[11px] text-ink-faint">
          Détection : {sourceLabel}
        </p>
      )}

      {/* Actions */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={onToggleDetail}
          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors ${
            detailOpen
              ? "bg-adm-50 text-adm-700"
              : "text-ink-soft hover:bg-adm-50 hover:text-adm-600"
          }`}
        >
          <IconDetail />
          Détails
          {mods.length > 0 && (
            <span className="rounded-full bg-adm-700 px-1.5 py-px text-[10px] font-bold text-white tabular-nums">
              {mods.length}
            </span>
          )}
          <IconChevron dir={detailOpen ? "up" : "down"} />
        </button>

        <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-line" />

        {e.statusId !== "cloture" && (
          <button
            type="button"
            title="Bilan de l'événement — répondre"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-ink-soft transition-colors hover:bg-adm-50 hover:text-adm-600"
            onClick={onReply}
          >
            <IconReply />
            {mods.length > 0 && (
              <span className="text-xs font-semibold tabular-nums">
                {mods.length}
              </span>
            )}
          </button>
        )}
        {e.resolved && (
          <button
            type="button"
            title="Rouvrir"
            className={ACTION}
            onClick={onToggleResolved}
          >
            <IconReopen />
          </button>
        )}
        <button
          type="button"
          title="Copier le message"
          className={ACTION}
          onClick={onCopy}
        >
          <IconCopy />
        </button>
        <a
          href={waShareUrl(e.message)}
          target="_blank"
          rel="noopener noreferrer"
          title="Partager sur WhatsApp"
          className={ACTION}
        >
          <IconWhatsApp />
        </a>
        {e.statusId !== "cloture" && (
          <button
            type="button"
            title="Retour à la normale"
            className="ml-1 inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-ok/30 bg-ok/10 text-ok transition-colors hover:bg-ok hover:text-white"
            onClick={onNormal}
          >
            <IconNormal />
          </button>
        )}
      </div>

      {/* Détails / modifications */}
      {detailOpen && (
        <div className="mt-3 rounded-lg border border-line bg-paper p-3">
          <p className="text-[11px] font-bold tracking-wide text-ink-soft">
            Modifications ({mods.length})
          </p>
          {mods.length === 0 ? (
            <p className="mt-1.5 text-sm text-ink-faint">
              Aucune modification pour l'instant.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {mods.map((r) => (
                <div
                  key={`${r.refCode}-${r.at}`}
                  className="rounded-lg border border-line bg-card p-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-adm-700">
                      {r.refCode}
                    </span>
                    <span className="text-xs text-ink-faint">
                      {formatDate(r.at)} · {statusOf(r.statusId)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <MessageText text={r.message} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function statusOf(id: string): string {
  const map: Record<string, string> = {
    confirmer: "En cours de confirmation",
    confirme: "Confirmé",
    intervention: "Intervention en cours",
    leve: "Événement levé",
    cloture: "Clôture",
  };
  return map[id] ?? id;
}