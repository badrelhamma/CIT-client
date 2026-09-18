import type { ImpactDef } from "@/types";

interface ImpactSelectorProps {
  impacts: ImpactDef[];
  value: string;
  onChange: (id: string) => void;
}

export function ImpactSelector({ impacts, value, onChange }: ImpactSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {impacts.map((impact) => {
        const active = value === impact.id;
        return (
          <button
            key={impact.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(impact.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-base transition-colors ${
              active
                ? "border-adm-600 bg-adm-600 text-white shadow-sm"
                : "border-line bg-card text-ink-soft hover:border-adm-300 hover:bg-adm-50"
            }`}
          >
            {impact.label}
          </button>
        );
      })}
    </div>
  );
}