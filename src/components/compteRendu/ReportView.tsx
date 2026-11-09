import type { CompteRenduExport } from "@/services/compteRenduPdf";

const or = (v: string | undefined | null, fallback = "—") =>
  v && String(v).trim() ? String(v).trim() : fallback;

function num(v: string | undefined | null): number {
  const n = Number(v ?? "");
  return Number.isFinite(n) ? n : 0;
}

function StatutBadge({ statut }: { statut: string }) {
  const s = (statut ?? "").trim().toLowerCase();
  const bg =
    s === "normale"
      ? "#16a34a"
      : s === "perturbé" || s === "perturbe" || s === "anomalie"
        ? "#ea580c"
        : s === "hors service"
          ? "#dc2626"
          : "#e2e8f0";
  const fg = s === "" || s === "—" ? "#475569" : bg === "#e2e8f0" ? "#475569" : "#fff";
  return (
    <span
      style={{
        background: bg,
        color: fg,
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {or(statut)}
    </span>
  );
}

function Kpi({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  const n = num(value);
  const isAlert = alert ?? n > 0;
  return (
    <div
      className="rounded-md border px-2 py-2 text-center"
      style={{
        borderColor: isAlert ? "#fecaca" : "#e2e8f0",
        background: isAlert ? "#fef2f2" : "#f8fafc",
      }}
    >
      <div
        className="text-xl font-extrabold tabular-nums"
        style={{ color: isAlert ? "#991b1b" : "#0f172a" }}
      >
        {or(value, "0")}
      </div>
      <div className="mt-0.5 text-[10px] leading-tight font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </div>
    </div>
  );
}

interface ReportViewProps {
  data: CompteRenduExport;
  generatedAt?: string;
}

export function ReportView({ data: r, generatedAt }: ReportViewProps) {
  const generated = generatedAt ?? new Date().toLocaleString("fr-FR");
  const kpis = [
    { label: "Accidents", value: r.accidents, alert: num(r.accidents) > 0 },
    { label: "Bouchons", value: r.bouchons, alert: num(r.bouchons) > 0 },
    { label: "Incendies", value: r.incendies, alert: num(r.incendies) > 0 },
    { label: "PMV publiés", value: r.pmv },
    { label: "Tickets créés", value: r.tickets },
    { label: "Autres évts", value: r.autres },
  ];

  return (
    <div
      id="cr-report-sheet"
      className="cr-sheet print-sheet mx-auto max-w-4xl rounded-md bg-white p-4 text-slate-800 shadow-lg sm:p-6"
      style={{
        fontFamily: "Inter, Roboto, system-ui, -apple-system, sans-serif",
        breakInside: "avoid",
        pageBreakInside: "avoid",
      }}
    >
      <header>
        <div
          className="flex flex-wrap items-start justify-between gap-3 rounded-t-md px-4 py-3 text-white"
          style={{ background: "#0f172a" }}
        >
          <div>
            <h2 className="text-sm font-extrabold tracking-wide sm:text-base">
              COMPTE RENDU DE POSTE DES MANAGERS
            </h2>
            <p className="mt-0.5 text-[11px] text-white/80">
              Centre Info Trafic — CIT | Autoroutes du Maroc
            </p>
          </div>
          <dl className="min-w-40 text-right text-[11px] leading-relaxed text-white/85">
            <div>
              <dt className="inline font-semibold text-white">Date : </dt>
              <dd className="inline">{or(r.date)}</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-white">Généré le : </dt>
              <dd className="inline">{generated}</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-white">Poste : </dt>
              <dd className="inline">{or(r.poste)}</dd>
            </div>
          </dl>
        </div>
        <div className="flex" aria-hidden="true">
          <div style={{ height: 4, flex: 3, background: "#0f172a" }} />
          <div style={{ height: 4, flex: 1, background: "#e11d48" }} />
        </div>
      </header>

      <section className="cr-section mt-4" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
        <h3 className="text-xs font-extrabold tracking-wide text-slate-900 uppercase">
          1 · Ouverture de poste & relève
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Heure début / fin", `${or(r.heureDebut)} → ${or(r.heureFin)}`],
            ["Manager sortant", or(r.sortant)],
            ["Manager entrant", or(r.entrant)],
            ["Trafic / Météo", `${or(r.trafic)} · ${or(r.meteo)}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
              <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">{k}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cr-section mt-4" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
        <h3 className="text-xs font-extrabold tracking-wide text-slate-900 uppercase">
          2 · Chiffres clés & événements
        </h3>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {kpis.map((k) => (
            <Kpi key={k.label} label={k.label} value={k.value} alert={k.alert} />
          ))}
        </div>
        <p className="mt-2 grid gap-2 text-[11px] text-slate-600 sm:grid-cols-3">
          <span>
            <strong className="text-slate-800">Validés : </strong>
            {or(r.valides, "0")} · <strong className="text-slate-800">Dévalidés : </strong>
            {or(r.devalides, "0")}
          </span>
          <span className="sm:col-span-2">
            <strong className="text-slate-800">Faits marquants : </strong>
            {or(r.details)}
          </span>
        </p>
      </section>

      <section className="cr-section mt-4" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
        <h3 className="text-xs font-extrabold tracking-wide text-slate-900 uppercase">
          3 · Passation & état des équipements du CIT
        </h3>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {(r.equipements?.length ? r.equipements : []).map((e) => (
            <div
              key={e.label}
              className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-slate-800">{or(e.label)}</p>
                <p className="truncate text-[10px] text-slate-500">{or(e.obs)}</p>
              </div>
              <StatutBadge statut={e.statut} />
            </div>
          ))}
        </div>
      </section>

      <section className="cr-section mt-4" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
        <h3 className="text-xs font-extrabold tracking-wide text-slate-900 uppercase">
          4 · Consignes, reporting & validation
        </h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
              Points sensibles & consignes
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
              <strong>Sensibles : </strong>
              {or(r.sensibles)}
              <br />
              <strong>Consignes prochain poste : </strong>
              {or(r.consignes)}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
              Difficultés & reporting
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
              <strong>Difficultés / actions : </strong>
              {or(r.difficultes)}
              <br />
              <strong>Reporting transmis : </strong>
              {or(r.reporting)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <p className="text-right text-[11px] text-slate-700">
            <strong>Signé électroniquement par :</strong> {or(r.signature)}
            <br />
            <span className="text-slate-500">
              {or(r.date)} · {or(r.heureDebut)} → {or(r.heureFin)}
            </span>
          </p>
        </div>
      </section>

      <footer className="mt-4 border-t border-slate-200 pt-2 text-center text-[10px] tracking-wide text-slate-500">
        Confidentiel — Usage interne CIT ADM · Généré le {generated}
      </footer>
    </div>
  );
}
