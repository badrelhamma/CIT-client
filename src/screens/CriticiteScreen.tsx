import { useState } from "react";
import { Card } from "@/components/base/Card";
import { Field } from "@/components/base/Field";
import { useEvent } from "@/contexts/EventContext";
import { useCriticite } from "@/hooks/useCriticite";
import { selectCls } from "./repertoireUi";
import type { CriticiteLevelName } from "@/types";

const CRITICITE_EMOJI: Record<CriticiteLevelName, string> = {
  Courant: "🟡",
  Critique: "🟠",
  Majeur: "🔴",
};

const CRITICITE_COLOR_ID: Record<CriticiteLevelName, "jaune" | "orange" | "rouge"> =
  {
    Courant: "jaune",
    Critique: "orange",
    Majeur: "rouge",
  };

const CRITICITE_LEVELS: CriticiteLevelName[] = ["Courant", "Critique", "Majeur"];

export function CriticiteScreen() {
  const { criticite } = useCriticite();
  const [selected, setSelected] = useState<{
    level: CriticiteLevelName;
    criterion: string;
  } | null>(null);

  const { setColor } = useEvent();

  function applySelection(level: CriticiteLevelName, criterion: string) {
    if (!criterion) {
      setSelected(null);
      setColor(null);
      return;
    }
    setSelected({ level, criterion });
    setColor(CRITICITE_COLOR_ID[level]);
  }

  const criteresParNiveau: Record<CriticiteLevelName, string[]> = {
    Courant: criticite.Courant,
    Critique: criticite.Critique,
    Majeur: criticite.Majeur,
  };

  return (
    <section
      aria-label="Niveau de criticité de l'événement"
      className="mx-auto w-full max-w-4xl"
    >
      <div className="mb-6">
        <p className="font-display text-3xl text-ink">
          Niveau de criticité de l'événement
        </p>
        <p className="mt-1 text-base text-ink-soft">
          Les trois barres sont liées : choisir un critère sélectionne le niveau
          correspondant pour le message.
        </p>
      </div>

      <Card className="border-t-4 border-t-orange">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start w-full">
              {CRITICITE_LEVELS.map((level) => (
                <Field key={level} label={`${CRITICITE_EMOJI[level]} ${level}`}>
                  <select
                    value={
                      selected?.level === level ? selected.criterion : ""
                    }
                    onChange={(e) => applySelection(level, e.target.value)}
                    className={`${selectCls} ${
                      level === "Courant"
                        ? "border-ok/60"
                        : level === "Critique"
                          ? "border-orange"
                          : "border-red"
                    }`}
                  >
                    <option value=""></option>
                    {(criteresParNiveau[level] ?? []).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-line bg-paper p-3">
              {selected ? (
                <p className="text-sm leading-relaxed text-ink">
                  <b>
                    {CRITICITE_EMOJI[selected.level]} Niveau {selected.level} :
                  </b>{" "}
                  {selected.criterion}
                </p>
              ) : (
                <p className="text-sm text-ink-faint">
                  Aucun critère de criticité sélectionné.
                </p>
              )}
            </div>
      </Card>
    </section>
  );
}
