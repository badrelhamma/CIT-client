import { useState, type ReactNode } from "react";
import { Button } from "@/components/base/Button";
import { Card } from "@/components/base/Card";
import { useTmd } from "@/hooks/useTmd";
import { normalize } from "./repertoireUi";
import type { TmdEntry } from "@/types";

interface TmdValues {
  onu: string;
  description: string;
  danger: string;
}

export function TmdScreen() {
  const { entries, onuValues, descriptionValues, dangerValues } = useTmd();

  const [onu, setOnu] = useState("");
  const [description, setDescription] = useState("");
  const [danger, setDanger] = useState("");
  const [result, setResult] = useState<ReactNode>(null);

  function applyEntry(entry: TmdEntry) {
    setOnu(entry.onu ?? "");
    setDescription(entry.description ?? "");
    setDanger(entry.danger ?? "");
    setResult(
      <p>
        <b>N° ONU :</b> {entry.onu} &nbsp;|&nbsp; <b>Nom :</b>{" "}
        {entry.description} &nbsp;|&nbsp; <b>Danger :</b> {entry.danger}
      </p>,
    );
  }

  function linkTmd(changedKey: keyof TmdEntry, value: string, next: TmdValues) {
    const q = normalize(value);
    if (!q) {
      setResult(null);
      return;
    }

    const exact = entries.filter((r) => normalize(String(r[changedKey] ?? "")) === q);
    if (exact.length === 1) {
      applyEntry(exact[0]);
      return;
    }

    if (exact.length > 1) {
      const sameOnu = new Set(exact.map((r) => r.onu));
      const sameDesc = new Set(exact.map((r) => r.description));
      const sameDanger = new Set(exact.map((r) => r.danger));
      if (sameOnu.size === 1) setOnu(exact[0].onu ?? "");
      if (sameDesc.size === 1) setDescription(exact[0].description ?? "");
      if (sameDanger.size === 1) setDanger(exact[0].danger ?? "");
      if (sameOnu.size === 1 && sameDesc.size === 1 && sameDanger.size === 1) {
        applyEntry(exact[0]);
      } else {
        setResult(
          <p>
            <b>{exact.length} correspondances.</b> Précisez un deuxième critère
            pour identifier exactement la matière.
          </p>,
        );
      }
      return;
    }

    const partial = entries.filter(
      (r) =>
        (!next.onu || normalize(r.onu).includes(normalize(next.onu))) &&
        (!next.description ||
          normalize(r.description).includes(normalize(next.description))) &&
        (!next.danger || normalize(r.danger).includes(normalize(next.danger))),
    );
    if (partial.length === 1) {
      applyEntry(partial[0]);
    } else if (partial.length > 1) {
      setResult(
        <p>
          <b>{partial.length} correspondances.</b> Continuez la saisie ou
          choisissez une proposition.
        </p>,
      );
    } else {
      setResult(<p>Aucune correspondance trouvée.</p>);
    }
  }

  function handleChange(key: keyof TmdEntry, value: string) {
    const next: TmdValues = { onu, description, danger, [key]: value };
    if (key === "onu") setOnu(value);
    if (key === "description") setDescription(value);
    if (key === "danger") setDanger(value);
    linkTmd(key, value, next);
  }

  function handleBlur(key: keyof TmdEntry) {
    const value = key === "onu" ? onu : key === "description" ? description : danger;
    linkTmd(key, value, { onu, description, danger });
  }

  function reset() {
    setOnu("");
    setDescription("");
    setDanger("");
    setResult(null);
  }

  return (
    <section
      aria-label="Recherche TMD — Plaque orange ADR"
      className="mx-auto w-full max-w-4xl"
    >
      <div className="mb-6">
        <p className="font-display text-3xl text-ink">
          Recherche TMD — Plaque orange ADR
        </p>
        <p className="mt-1 text-base text-ink-soft">
          Les trois recherches sont liées : sélectionnez une valeur dans
          n'importe quelle barre pour afficher les informations correspondantes.
        </p>
      </div>

      <Card className="border-t-4 border-t-orange">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start w-full">
              <div className="flex flex-col gap-1.5 w-full">
                <label htmlFor="tmd-onu" className="text-sm font-medium text-slate-300 min-h-[2.5rem] leading-snug">
                  N° ONU
                </label>
                <input
                  id="tmd-onu"
                  list="tmdOnuList"
                  value={onu}
                  onChange={(e) => handleChange("onu", e.target.value)}
                  onBlur={() => handleBlur("onu")}
                  placeholder="Ex. 1203"
                  className="w-full h-11 px-3 rounded-lg border border-slate-700 bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <label htmlFor="tmd-description" className="text-sm font-medium text-slate-300 min-h-[2.5rem] leading-snug">
                  Nom et description — 3.1.2
                </label>
                <input
                  id="tmd-description"
                  list="tmdDescriptionList"
                  value={description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  onBlur={() => handleBlur("description")}
                  placeholder="Ex. ESSENCE"
                  className="w-full h-11 px-3 rounded-lg border border-slate-700 bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <label htmlFor="tmd-danger" className="text-sm font-medium text-slate-300 min-h-[2.5rem] leading-snug">
                  N° d'identification du danger — 5.3.2.3
                </label>
                <input
                  id="tmd-danger"
                  list="tmdDangerList"
                  value={danger}
                  onChange={(e) => handleChange("danger", e.target.value)}
                  onBlur={() => handleBlur("danger")}
                  placeholder="Ex. 33"
                  className="w-full h-11 px-3 rounded-lg border border-slate-700 bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <datalist id="tmdOnuList">
              {onuValues.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            <datalist id="tmdDescriptionList">
              {descriptionValues.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            <datalist id="tmdDangerList">
              {dangerValues.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>

            <div className="mt-4">
              <Button variant="secondary" size="sm" onClick={reset}>
                Réinitialiser la recherche TMD
              </Button>
            </div>

            {result && (
              <div className="mt-4 rounded-lg border-l-4 border-l-orange bg-orange/10 p-3 text-sm leading-relaxed text-ink">
                {result}
              </div>
            )}
      </Card>
    </section>
  );
}
