import type { ActorStatusDef } from "@/types";

interface ActorStatusSelectorProps {
  statuses: ActorStatusDef[];
  value: string;
  onChange: (id: string) => void;
}

export function ActorStatusSelector({
  statuses,
  value,
  onChange,
}: ActorStatusSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((st) => {
        const active = value === st.id;
        return (
          <button
            key={st.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(st.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-base transition-colors ${
              active
                ? "border-adm-600 bg-adm-600 text-white shadow-sm"
                : "border-line bg-card text-ink-soft hover:border-adm-300 hover:bg-adm-50"
            }`}
          >
            {st.label}
          </button>
        );
      })}
    </div>
  );
}