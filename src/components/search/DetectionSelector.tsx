import type { DetectionSourceDef } from "@/types";

interface DetectionSelectorProps {
  sources: DetectionSourceDef[];
  value: string | null;
  onChange: (id: string | null) => void;
}

export function DetectionSelector({
  sources,
  value,
  onChange,
}: DetectionSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sources.map((source) => {
        const active = value === source.id;
        return (
          <button
            key={source.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : source.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
              active
                ? "border-adm-600 bg-adm-600 text-white shadow-sm"
                : "border-line bg-card text-ink-soft hover:border-adm-300 hover:bg-adm-50"
            }`}
          >
            {active && (
              <svg
                aria-hidden="true"
                className="size-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
            {source.label}
          </button>
        );
      })}
    </div>
  );
}