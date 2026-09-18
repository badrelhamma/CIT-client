import {
  useEffect,
  useMemo,
  useState,
  type InputHTMLAttributes,
} from "react";
import { Badge } from "@/components/base/Badge";
import { Button } from "@/components/base/Button";
import { Card } from "@/components/base/Card";
import { Dialog } from "@/components/base/Dialog";
import { Field } from "@/components/base/Field";
import { inputCls, selectCls } from "./repertoireUi";
import {
  exportCompteRenduPdf,
  type CompteRenduEquip,
} from "@/services/compteRenduPdf";

const MANAGERS = [
  "HICHAM.ELHAMMAR",
  "AKBABI.KAMAL",
  "BADR.ELHAMMA",
  "ELHANI.ELFATMI",
  "SAHLI.REDA",
  "BORKI.AALAAEDDINE",
  "ELWARDI.ELMEHDI",
  "BOUIDIR.SIFEDDINE",
  "BELGHITI Aziz",
];

const POSTES = ["Matin 08h-16h", "Après-midi 16-00", "Permanance 00-08h"];
const TRAFIC = ["Fluide", "dense", "Ralenté", "perturbé"];
const EQUIP_STATUTS = ["Normale", "Perturbé", "hors service"];

const EQUIPEMENTS = [
  "Mur d'images",
  "Poste opérateurs / PC",
  "Application ADMTRAFIC",
  "Milestone / Vidéosurveillance",
  "Radio TETRA",
  "Téléphones",
  "Réseau / Internet",
  "Climatisation CIT / local technique",
  "Caméras hors service",
];

const LIST_KEY = "cr_manager_cit_list";

interface CrState {
  date: string;
  poste: string;
  heureDebut: string;
  heureFin: string;
  sortant: string;
  entrant: string;
  trafic: string;
  meteo: string;
  accidents: string;
  bouchons: string;
  incendies: string;
  autres: string;
  details: string;
  pmv: string;
  tickets: string;
  valides: string;
  devalides: string;
  reporting: string;
  sensibles: string;
  consignes: string;
  difficultes: string;
  signature: string;
  equipements: CompteRenduEquip[];
}

interface SavedCr {
  id: string;
  savedAt: string;
  state: CrState;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function loadList(): SavedCr[] {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SavedCr[]) : [];
  } catch {
    return [];
  }
}

function persistList(list: SavedCr[]) {
  try {
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function freshState(): CrState {
  return {
    date: "",
    poste: "",
    heureDebut: "",
    heureFin: "",
    sortant: "",
    entrant: "",
    trafic: "",
    meteo: "",
    accidents: "",
    bouchons: "",
    incendies: "",
    autres: "",
    details: "",
    pmv: "",
    tickets: "",
    valides: "",
    devalides: "",
    reporting: "",
    sensibles: "",
    consignes: "",
    difficultes: "",
    signature: "",
    equipements: EQUIPEMENTS.map((label) => ({
      label,
      statut: "",
      obs: "",
    })),
  };
}

/* Données de démonstration : mois 08 et 09 avec les 3 postes, chaque
   entrant est un manager et chaque compte rendu est signé. */
interface SampleConfig {
  date: string;
  poste: string;
  sortant: string;
  entrant: string;
  trafic: string;
  meteo: string;
}

const SAMPLE_TRAFIC = ["Fluide", "dense", "Ralenté", "perturbé"];
const SAMPLE_METEO = [
  "Ciel dégagé",
  "Passages nuageux",
  "Pluie faible",
  "Brouillard matinal",
  "Vent fort",
  "Canicule",
];

const SAMPLE_MANAGERS = [
  "HICHAM.ELHAMMAR",
  "AKBABI.KAMAL",
  "BADR.ELHAMMA",
  "ELHANI.ELFATMI",
  "SAHLI.REDA",
  "BORKI.AALAAEDDINE",
  "ELWARDI.ELMEHDI",
  "BOUIDIR.SIFEDDINE",
  "BELGHITI Aziz",
];

/* Génère 40 configurations : dates réparties sur août et septembre 2026,
   postes en rotation (3 postes), managers sortants/entrants différents. */
function buildSampleConfigs(count: number): SampleConfig[] {
  const configs: SampleConfig[] = [];
  let dayOfMonth = 1;
  let month = 8;
  let lastDay = 31;
  for (let i = 0; i < count; i++) {
    const poste = POSTES[i % POSTES.length];
    const sortant = SAMPLE_MANAGERS[i % SAMPLE_MANAGERS.length];
    const entrant =
      SAMPLE_MANAGERS[(i + 1 + Math.floor(i / SAMPLE_MANAGERS.length)) % SAMPLE_MANAGERS.length];
    configs.push({
      date: `2026-${String(month).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`,
      poste,
      sortant,
      entrant,
      trafic: SAMPLE_TRAFIC[i % SAMPLE_TRAFIC.length],
      meteo: SAMPLE_METEO[i % SAMPLE_METEO.length],
    });
    dayOfMonth += i % 3 === 0 ? 2 : 1;
    if (dayOfMonth > lastDay) {
      dayOfMonth = 1;
      month = 9;
      lastDay = 30;
    }
  }
  return configs;
}

function posteHours(poste: string): [string, string] {
  if (poste === "Matin 08h-16h") return ["08:00", "16:00"];
  if (poste === "Après-midi 16-00") return ["16:00", "00:00"];
  return ["00:00", "08:00"];
}

function buildSampleCr(config: SampleConfig, index: number): SavedCr {
  const s = freshState();
  const [hd, hf] = posteHours(config.poste);
  s.date = config.date;
  s.poste = config.poste;
  s.heureDebut = hd;
  s.heureFin = hf;
  s.sortant = config.sortant;
  s.entrant = config.entrant;
  s.trafic = config.trafic;
  s.meteo = config.meteo;
  s.accidents = String(index % 3);
  s.bouchons = String(index % 2 === 0 ? index + 1 : index);
  s.incendies = "0";
  s.autres = index % 5 === 4 ? "Véhicule en panne sur bretelle" : "0";
  s.details =
    index % 5 === 4
      ? "Véhicule en panne neutralisé sur bretelle de sortie, signalisation en place."
      : "Circulation normale, aucun événement majeur durant le poste.";
  s.pmv = String(index % 2);
  s.tickets = String(index % 3);
  s.valides = String(index % 3);
  s.devalides = String(index % 2 === 0 ? 0 : 1);
  s.reporting = "Reporting transmis au PC Centrale";
  s.sensibles =
    index % 2 === 0
      ? "Surveiller la zone chantier A1 PK 12"
      : "Point sensible : bretelle A3 PK 34 en heure de pointe";
  s.consignes = "Veiller à la mise à jour des PMV et tickets.";
  s.difficultes = "Aucune difficulté particulière.";
  s.signature = config.entrant;
  s.equipements = s.equipements.map((e, i) => ({
    label: e.label,
    statut: i === 5 ? "hors service" : "Normale",
    obs: i === 5 ? "À relancer auprès de la maintenance" : "",
  }));
  return {
    id: makeId(),
    savedAt: new Date(`${config.date}T12:00:00.000Z`).toISOString(),
    state: s,
  };
}

function buildSampleList(): SavedCr[] {
  return buildSampleConfigs(40).map((config, index) =>
    buildSampleCr(config, index),
  );
}

function buildText(s: CrState): string {
  const L: string[] = [];
  L.push("COMPTE RENDU DE POSTE DES MANAGERS — CIT");
  L.push("==========================================");
  L.push(`DATE : ${s.date}`);
  L.push(`POSTE : ${s.poste}`);
  L.push(`HEURE DEBUT : ${s.heureDebut} — FIN : ${s.heureFin}`);
  L.push(`MANAGER SORTANT : ${s.sortant}`);
  L.push(`MANAGER ENTRANT : ${s.entrant}`);
  L.push(`SITUATION TRAFIC : ${s.trafic}`);
  L.push(`METEO : ${s.meteo}`);
  L.push("");
  L.push("ÉVÉNEMENTS ET ACCIDENTS");
  L.push("=======================");
  L.push(`accidents : ${s.accidents || "0"}`);
  L.push(`bouchons (ralentissements) : ${s.bouchons || "0"}`);
  L.push(`incendies : ${s.incendies || "0"}`);
  L.push(`autres événements : ${s.autres || "0"}`);
  L.push("DÉTAILS DES ÉVÉNEMENTS IMPORTANTS :");
  L.push(s.details || "—");
  L.push(`PMV publiés : ${s.pmv || "0"} — Tickets créés : ${s.tickets || "0"}`);
  L.push(`Accidents validés : ${s.valides || "0"} — Dévalidés : ${s.devalides || "0"}`);
  L.push("");
  L.push("PASSATION DES ÉQUIPEMENTS DU CIT");
  L.push("=================================");
  for (const e of s.equipements) {
    L.push(`${e.label.toUpperCase()} : ${e.statut || "—"}${e.obs ? " — " + e.obs : ""}`);
  }
  L.push("");
  L.push("REPORTING ET CONSIGNES");
  L.push("======================");
  L.push(`Reporting transmis : ${s.reporting || "—"}`);
  L.push(`Points sensibles : ${s.sensibles || "—"}`);
  L.push(`Consignes pour le prochain poste : ${s.consignes || "—"}`);
  L.push(`Difficultés / actions proposées : ${s.difficultes || "—"}`);
  L.push("");
  L.push(`SIGNE PAR : ${s.signature || "—"}`);
  return L.join("\n");
}

interface CompteRenduScreenProps {
  initialView?: "ajouter" | "liste";
}

const CR_EMPTY_FILTERS = {
  q: "",
  dateFrom: "",
  dateTo: "",
  poste: "",
  signature: "",
};

export function CompteRenduScreen({
  initialView = "liste",
}: CompteRenduScreenProps) {
  const [state, setState] = useState<CrState>(freshState);
  const [savedList, setSavedList] = useState<SavedCr[]>(loadList);
  const [msg, setMsg] = useState<string | null>(null);
  const [view, setView] = useState<"ajouter" | "liste">(initialView);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(CR_EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const preview = useMemo(() => buildText(state), [state]);

  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(null), 2600);
    return () => window.clearTimeout(t);
  }, [msg]);

  /* Retour à la première page quand la liste ou les filtres changent. */
  useEffect(() => {
    setPage(1);
  }, [savedList.length, filters.q, filters.dateFrom, filters.dateTo, filters.poste, filters.signature]);

  const filtersDirty =
    filters.q !== "" || filters.dateFrom !== "" || filters.dateTo !== "" ||
    filters.poste !== "" || filters.signature !== "";

  const filteredList = useMemo(() => {
    const q = filters.q.toLowerCase();
    return savedList.filter((entry) => {
      const s = entry.state;
      if (filters.dateFrom && s.date < filters.dateFrom) return false;
      if (filters.dateTo && s.date > filters.dateTo) return false;
      if (filters.poste && s.poste !== filters.poste) return false;
      if (filters.signature && s.signature !== filters.signature) return false;
      if (q) {
        const hay = [
          s.date, s.poste, s.sortant, s.entrant, s.trafic, s.meteo,
          s.signature, s.details, s.consignes, s.sensibles,
          s.accidents, s.bouchons, s.incendies, s.pmv, s.tickets,
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [savedList, filters]);

  /* Remplit la liste au premier chargement si aucune donnée n'existe. */
  useEffect(() => {
    const raw = localStorage.getItem(LIST_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) return;
      } catch {
        /* continue vers le remplissage */
      }
    }
    const samples = buildSampleList();
    persistList(samples);
    setSavedList(samples);
    setMsg("Données d'exemple chargées : 40 comptes rendus signés (mois 08 et 09).");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patch(p: Partial<CrState>) {
    setState((s) => ({ ...s, ...p }));
  }

  function patchEquip(i: number, p: Partial<Pick<CompteRenduEquip, "statut" | "obs">>) {
    setState((s) => ({
      ...s,
      equipements: s.equipements.map((e, idx) =>
        idx === i ? { ...e, ...p } : e,
      ),
    }));
  }

  function addToSaved() {
    setSavedList((prev) => {
      const latest = prev[0];
      if (latest && JSON.stringify(latest.state) === JSON.stringify(state)) {
        return prev;
      }
      const next: SavedCr[] = [
        { id: makeId(), savedAt: new Date().toISOString(), state },
        ...prev,
      ];
      persistList(next);
      return next;
    });
  }

  function enregistrer() {
    try {
      addToSaved();
      setState(freshState());
      setMsg("Compte rendu enregistré dans les listes. Formulaire réinitialisé.");
    } catch {
      setMsg("Enregistrement local impossible.");
    }
  }

  function telechargerPdf() {
    exportCompteRenduPdf(state);
    addToSaved();
    setState(freshState());
    setMsg("PDF généré et enregistré dans les listes. Formulaire réinitialisé.");
  }

  function reprendre(saved: CrState) {
    setState(saved);
    setView("ajouter");
    setMsg("Compte rendu chargé dans le formulaire.");
  }

  function supprimerCr(id: string) {
    if (!window.confirm("Supprimer ce compte rendu de la liste ?")) return;
    setSavedList((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persistList(next);
      return next;
    });
  }

  function reinitialiser() {
    if (!window.confirm("Réinitialiser le formulaire du compte rendu ?")) return;
    setState(freshState());
    setMsg("Formulaire réinitialisé.");
  }

  const num: InputHTMLAttributes<HTMLInputElement> = {
    type: "number",
    min: "0",
    step: "1",
    inputMode: "numeric",
  };

  return (
    <section
      aria-label="Compte rendu de poste des managers CIT"
      className="mx-auto w-full max-w-6xl"
    >
      {view === "ajouter" && (
        <div className="mb-6">
          <p className="font-display text-2xl font-bold text-ink">
            Nouveau compte rendu de poste — CIT.
          </p>
        </div>
      )}

      {view === "ajouter" && (
        <>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="border-t-4 border-t-adm-600">
            <p className="text-lg font-bold text-adm-700">1. Ouverture du poste</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Date">
                <input
                  type="date"
                  value={state.date}
                  onChange={(e) => patch({ date: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Poste">
                <select
                  value={state.poste}
                  onChange={(e) => patch({ poste: e.target.value })}
                  className={selectCls}
                >
                  {POSTES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Heure début">
                <input
                  type="time"
                  value={state.heureDebut}
                  onChange={(e) => patch({ heureDebut: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Heure fin">
                <input
                  type="time"
                  value={state.heureFin}
                  onChange={(e) => patch({ heureFin: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Manager sortant">
                <select
                  value={state.sortant}
                  onChange={(e) => patch({ sortant: e.target.value })}
                  className={selectCls}
                >
                  <option value="">—</option>
                  {MANAGERS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Manager entrant">
                <select
                  value={state.entrant}
                  onChange={(e) => patch({ entrant: e.target.value })}
                  className={selectCls}
                >
                  <option value="">—</option>
                  {MANAGERS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Situation trafic">
                <select
                  value={state.trafic}
                  onChange={(e) => patch({ trafic: e.target.value })}
                  className={selectCls}
                >
                  {TRAFIC.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Météo">
                <input
                  type="text"
                  value={state.meteo}
                  onChange={(e) => patch({ meteo: e.target.value })}
                  placeholder="Ex. ciel clair, vent..."
                  className={inputCls}
                />
              </Field>
            </div>
          </Card>

          <Card className="border-t-4 border-t-adm-600">
            <p className="text-lg font-bold text-adm-700">2. Événements et accidents</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Accidents">
                <input
                  {...num}
                  value={state.accidents}
                  onChange={(e) => patch({ accidents: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Bouchons / Ralen">
                <input
                  {...num}
                  value={state.bouchons}
                  onChange={(e) => patch({ bouchons: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Incendies">
                <input
                  {...num}
                  value={state.incendies}
                  onChange={(e) => patch({ incendies: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Autres even.">
                <input
                  {...num}
                  value={state.autres}
                  onChange={(e) => patch({ autres: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Détails des événements importants">
                <textarea
                  value={state.details}
                  onChange={(e) => patch({ details: e.target.value })}
                  placeholder="Décrire les événements significatifs du poste..."
                  rows={3}
                  className={`${inputCls} resize-y`}
                />
              </Field>
            </div>
            <p className="mt-4 text-sm font-semibold text-adm-700">
              Diffusion et tickets
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="PMV publiés">
                <input
                  {...num}
                  value={state.pmv}
                  onChange={(e) => patch({ pmv: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Tickets créés">
                <input
                  {...num}
                  value={state.tickets}
                  onChange={(e) => patch({ tickets: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Acc validés">
                <input
                  {...num}
                  value={state.valides}
                  onChange={(e) => patch({ valides: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Acc dévalidés">
                <input
                  {...num}
                  value={state.devalides}
                  onChange={(e) => patch({ devalides: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          </Card>

          <Card className="border-t-4 border-t-adm-600">
            <p className="text-lg font-bold text-adm-700">
              3. Passation des équipements du CIT
            </p>
            <div className="mt-4 grid gap-2">
              {state.equipements.map((e, i) => (
                <div
                  key={e.label}
                  className="grid gap-2 rounded-lg border border-line bg-adm-50 p-2.5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.75fr)_minmax(0,1.4fr)]"
                >
                  <p className="flex items-center px-1 text-sm font-bold text-ink">
                    {e.label}
                  </p>
                  <select
                    value={e.statut}
                    onChange={(ev) => patchEquip(i, { statut: ev.target.value })}
                    className={selectCls}
                    aria-label={`État ${e.label}`}
                  >
                    <option value="">—</option>
                    {EQUIP_STATUTS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={e.obs}
                    onChange={(ev) => patchEquip(i, { obs: ev.target.value })}
                    placeholder="Observation / anomalie"
                    className={inputCls}
                    aria-label={`Observation ${e.label}`}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-t-4 border-t-adm-600">
            <p className="text-lg font-bold text-adm-700">4. Reporting et consignes</p>
            <div className="mt-4 grid gap-3">
              <Field label="Reporting transmis">
                <input
                  type="text"
                  value={state.reporting}
                  onChange={(e) => patch({ reporting: e.target.value })}
                  placeholder="Reporting transmis à..."
                  className={inputCls}
                />
              </Field>
              <Field label="Points sensibles à surveiller">
                <textarea
                  value={state.sensibles}
                  onChange={(e) => patch({ sensibles: e.target.value })}
                  placeholder="Points sensibles à surveiller..."
                  rows={2}
                  className={`${inputCls} resize-y`}
                />
              </Field>
              <Field label="Consignes pour le prochain poste">
                <textarea
                  value={state.consignes}
                  onChange={(e) => patch({ consignes: e.target.value })}
                  placeholder="Consignes pour le prochain poste..."
                  rows={2}
                  className={`${inputCls} resize-y`}
                />
              </Field>
              <Field label="Difficultés / actions proposées">
                <textarea
                  value={state.difficultes}
                  onChange={(e) => patch({ difficultes: e.target.value })}
                  placeholder="Difficultés rencontrées et actions proposées..."
                  rows={2}
                  className={`${inputCls} resize-y`}
                />
              </Field>
              <Field label="Signé par">
                <select
                  value={state.signature}
                  onChange={(e) => patch({ signature: e.target.value })}
                  className={selectCls}
                >
                  <option value="">—</option>
                  {MANAGERS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Card className="border-t-4 border-t-adm-600">
            <p className="text-lg font-bold text-adm-700">Aperçu du compte rendu</p>
            <pre className="mt-3 max-h-[600px] overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-adm-50 p-3 font-mono text-xs leading-relaxed text-ink">
              {preview}
            </pre>
          </Card>
        </div>
      </div>

      <Card className="mt-6 border-t-4 border-t-adm-600">
            <p className="text-lg font-bold text-adm-700">Actions</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={enregistrer}>
                Enregistrer
              </Button>
              <Button size="sm" variant="secondary" onClick={telechargerPdf}>
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                PDF
              </Button>
              <Button size="sm" variant="danger" onClick={reinitialiser}>
                Réinitialiser
              </Button>
            </div>
            {msg && (
              <p className="mt-3 text-sm font-semibold text-ok">{msg}</p>
            )}
          </Card>
        </>
      )}

      {view === "liste" && (
        <>
          <div className="mb-4 flex flex-wrap items-stretch justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-bold text-ink">
                Listes des compte rendu de poste — CIT
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {filteredList.length} compte{filteredList.length > 1 ? "s" : ""} rendu
                {filteredList.length > 1 ? "s" : ""}
                {filteredList.length !== savedList.length
                  ? ` sur ${savedList.length} enregistré${savedList.length > 1 ? "s" : ""}`
                  : ` enregistré${savedList.length > 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex min-w-0 flex-1 items-center sm:w-72">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint">
                  <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></svg>
                </span>
                <input
                  type="search"
                  value={filters.q}
                  onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") setPage(1); }}
                  placeholder="Recherche texte libre…"
                  className="w-full rounded-xl border border-line bg-card py-2.5 pr-12 pl-10 text-base text-ink shadow-sm transition-colors focus:border-adm-500 focus:outline-none"
                />
                <button
                  type="button"
                  title={filtersDirty ? "Filtres actifs — ouvrir" : "Recherche & filtres"}
                  onClick={() => setFiltersOpen(true)}
                  className={`absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                    filtersDirty
                      ? "bg-adm-600 text-white hover:bg-adm-700"
                      : "text-ink-faint hover:bg-adm-50 hover:text-adm-600"
                  }`}
                >
                  <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" />
                    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" />
                  </svg>
                </button>
              </div>
              <Button size="sm" onClick={() => setView("ajouter")}>
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
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Ajouter CR
            </Button>
            </div>
          </div>

      {filtersOpen && (
        <Dialog
          title="Recherche & filtres"
          onClose={() => setFiltersOpen(false)}
          maxWidth="max-w-2xl"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="relative block">
              <span className="mb-1 block text-sm font-semibold text-ink-soft">Date début</span>
              <input
                type="date"
                value={filters.dateFrom}
                max={filters.dateTo || undefined}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                className={inputCls}
              />
            </label>
            <label className="relative block">
              <span className="mb-1 block text-sm font-semibold text-ink-soft">Date fin</span>
              <input
                type="date"
                value={filters.dateTo}
                min={filters.dateFrom || undefined}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                className={inputCls}
              />
            </label>
            <label className="relative block">
              <span className="mb-1 block text-sm font-semibold text-ink-soft">Poste</span>
              <select
                value={filters.poste}
                onChange={(e) => setFilters((f) => ({ ...f, poste: e.target.value }))}
                className={`${inputCls} cursor-pointer appearance-none pr-10`}
              >
                <option value="">Tous les postes</option>
                {POSTES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="relative block">
              <span className="mb-1 block text-sm font-semibold text-ink-soft">Manager signé</span>
              <select
                value={filters.signature}
                onChange={(e) => setFilters((f) => ({ ...f, signature: e.target.value }))}
                className={`${inputCls} cursor-pointer appearance-none pr-10`}
              >
                <option value="">Tous</option>
                {MANAGERS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFilters(CR_EMPTY_FILTERS)}
              disabled={!filtersDirty}
            >
              Réinitialiser
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="ml-auto"
              onClick={() => setFiltersOpen(false)}
            >
              Appliquer
            </Button>
          </div>
        </Dialog>
      )}

      <Card className="mt-3 border-t-4 border-t-adm-600">
        {filteredList.length === 0 ? (
          <p className="py-4 text-base text-ink-soft">
            Aucun compte rendu ne correspond aux filtres. Essayez de modifier votre recherche ou réinitialisez les filtres.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {filteredList
              .slice((page - 1) * 10, page * 10)
              .map((entry) => {
                const s = entry.state;
                const savedAt = new Date(entry.savedAt).toLocaleString("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "short",
                });
                return (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-line bg-card p-3.5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-base font-bold text-ink">
                        {s.date || "Sans date"} — {s.poste}
                      </p>
                      <Badge tone="adm">{savedAt}</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      {s.heureDebut || "—"} → {s.heureFin || "—"} · Sortant :{" "}
                      {s.sortant || "—"} · Entrant : {s.entrant || "—"}
                    </p>
                    <p className="text-xs leading-relaxed text-ink-soft">
                      Accidents : {s.accidents || "0"} · Bouchons :{" "}
                      {s.bouchons || "0"} · Incendies : {s.incendies || "0"} ·
                      PMV : {s.pmv || "0"} · Tickets : {s.tickets || "0"}
                    </p>
                    <p className="text-xs leading-relaxed text-ink-soft">
                      Signé par : {s.signature || "—"}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => reprendre(s)}>
                        Reprendre
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => exportCompteRenduPdf(s)}
                      >
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => supprimerCr(entry.id)}
                        className="text-red hover:bg-red/10"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}

        {filteredList.length > 10 && (
          <div className="mt-4 flex flex-col items-center gap-2 border-t border-line pt-4">
            <p className="text-xs tracking-wide text-ink-faint tabular-nums">
              {(page - 1) * 10 + 1}–{Math.min(page * 10, filteredList.length)} sur{" "}
              {filteredList.length}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                aria-label="Page précédente"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full border border-line bg-card px-3 text-sm font-semibold text-ink shadow-xs transition-colors hover:bg-adm-50 hover:text-adm-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ←
              </button>
              {Array.from(
                { length: Math.max(1, Math.ceil(filteredList.length / 10)) },
                (_, i) => i + 1,
              ).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-current={n === page ? "page" : undefined}
                  onClick={() => setPage(n)}
                  className={`inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    n === page
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
                disabled={page === Math.ceil(filteredList.length / 10)}
                onClick={() => setPage((p) => Math.min(Math.ceil(filteredList.length / 10), p + 1))}
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full border border-line bg-card px-3 text-sm font-semibold text-ink shadow-xs transition-colors hover:bg-adm-50 hover:text-adm-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        )}
      </Card>
        </>
      )}
    </section>
  );
}