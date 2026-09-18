import type { DamageDef } from "@/types";

interface DamageSelectorProps {
  damages: DamageDef[];
  selected: string[];
  onToggle: (id: string) => void;
}

export function DamageSelector({
  damages,
  selected,
  onToggle,
}: DamageSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {damages.map((damage) => {
        const active = selected.includes(damage.id);
        return (
          <button
            key={damage.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(damage.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-base transition-colors ${
              active
                ? "border-adm-600 bg-adm-600 text-white shadow-sm"
                : "border-line bg-card text-ink-soft hover:border-adm-300 hover:bg-adm-50"
            }`}
          >
            {damage.label}
          </button>
        );
      })}
    </div>
  );
}