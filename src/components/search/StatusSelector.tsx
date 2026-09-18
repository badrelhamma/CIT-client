import type { StatusDef } from "@/types";

interface StatusSelectorProps {
  statuses: StatusDef[];
  value: StatusDef | null;
  onChange: (status: StatusDef) => void;
}

export function StatusSelector({
  statuses,
  value,
  onChange,
}: StatusSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => {
        const active = value?.id === status.id;
        return (
          <button
            key={status.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(status)}
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors ${
              active
                ? "border-adm-600 bg-adm-600 text-white shadow-sm"
                : "border-line bg-card text-ink-soft hover:border-adm-300 hover:bg-adm-50"
            }`}
          >
            {status.label}
          </button>
        );
      })}
    </div>
  );
}