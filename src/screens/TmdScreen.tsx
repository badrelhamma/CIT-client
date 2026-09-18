import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/base/Button";
import { Card } from "@/components/base/Card";
import { ErrorState } from "@/components/base/ErrorState";
import { Field } from "@/components/base/Field";
import { LoadingState } from "@/components/base/LoadingState";
import { api } from "@/services/api";
import { normalize, inputCls } from "./repertoireUi";
import type { TmdEntry } from "@/types";

export function TmdScreen() {
  const [entries, setEntries] = useState<TmdEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [onu, setOnu] = useState("");
  const [description, setDescription] = useState("");
  const [danger, setDanger] = useState("");
  const [result, setResult] = useState<ReactNode>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .tmd()
      .then((data) => {
        if (alive) setEntries(data);
      })
      .catch(() => {
        if (alive) setError("Impossible de charger les données TMD.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const uniqueValues = useMemo(
    () =>
      (key: keyof TmdEntry) =>
        Array.from(
          new Set(
            entries.map((r) => String(r[key] ?? "").trim()).filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" })),
    [entries],
  );

  function linkTmd(changedKey: keyof TmdEntry, value: string) {
    const q = normalize(value);
    if (!q) {
      setResult(null);
      return;
    }

    const exact = entries.filter((r) => normalize(String(r[changedKey])) === q);
    if (exact.length === 1) {
      const r = exact[0];
      setOnu(r.onu ?? "");
      setDescription(r.description ?? "");
      setDanger(r.danger ?? "");
      setResult(
        <p>
          <b>N° ONU :</b> {r.onu} &nbsp;|&nbsp; <b>Nom :</b> {r.description}{" "}
          &nbsp;|&nbsp; <b>Danger :</b> {r.danger}
        </p>,
      );
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
        setResult(
          <p>
            <b>N° ONU :</b> {exact[0].onu} &nbsp;|&nbsp; <b>Nom :</b>{" "}
            {exact[0].description} &nbsp;|&nbsp; <b>Danger :</b>{" "}
            {exact[0].danger}
          </p>,
        );
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
        (!onu || normalize(r.onu).includes(normalize(onu))) &&
        (!description ||
          normalize(r.description).includes(normalize(description))) &&
        (!danger || normalize(r.danger).includes(normalize(danger))),
    );
    if (partial.length === 1) {
      const r = partial[0];
      setOnu(r.onu ?? "");
      setDescription(r.description ?? "");
      setDanger(r.danger ?? "");
      setResult(
        <p>
          <b>N° ONU :</b> {r.onu} &nbsp;|&nbsp; <b>Nom :</b> {r.description}{" "}
          &nbsp;|&nbsp; <b>Danger :</b> {r.danger}
        </p>,
      );
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
    if (key === "onu") setOnu(value);
    if (key === "description") setDescription(value);
    if (key === "danger") setDanger(value);
  }

  function handleBlur(key: keyof TmdEntry) {
    const value = key === "onu" ? onu : key === "description" ? description : danger;
    linkTmd(key, value);
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
        {loading && <LoadingState label="Chargement des données TMD..." />}
        {!loading && error && <ErrorState message={error} />}

        {!loading && !error && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="N° ONU">
                <input
                  list="tmdOnuList"
                  value={onu}
                  onChange={(e) => handleChange("onu", e.target.value)}
                  onBlur={() => handleBlur("onu")}
                  placeholder="Ex. 1203"
                  className={inputCls}
                />
              </Field>
              <Field label="Nom et description — 3.1.2">
                <input
                  list="tmdDescriptionList"
                  value={description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  onBlur={() => handleBlur("description")}
                  placeholder="Ex. ESSENCE"
                  className={inputCls}
                />
              </Field>
              <Field label="N° d'identification du danger — 5.3.2.3">
                <input
                  list="tmdDangerList"
                  value={danger}
                  onChange={(e) => handleChange("danger", e.target.value)}
                  onBlur={() => handleBlur("danger")}
                  placeholder="Ex. 33"
                  className={inputCls}
                />
              </Field>
            </div>

            <datalist id="tmdOnuList">
              {uniqueValues("onu").map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            <datalist id="tmdDescriptionList">
              {uniqueValues("description").map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            <datalist id="tmdDangerList">
              {uniqueValues("danger").map((v) => (
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
          </>
        )}
      </Card>
    </section>
  );
}