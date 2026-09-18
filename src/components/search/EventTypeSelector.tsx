import type { RequestTypeDef } from "@/types";

interface EventTypeSelectorProps {
  types: RequestTypeDef[];
  value: RequestTypeDef | null;
  onChange: (type: RequestTypeDef) => void;
}

export function EventTypeSelector({
  types,
  value,
  onChange,
}: EventTypeSelectorProps) {
  return (
    <div className="relative">
      <select
        id="event-type-select"
        aria-label="Type d'événement"
        value={value?.id ?? ""}
        onChange={(e) => {
          const type = types.find((t) => t.id === e.target.value);
          if (type) onChange(type);
        }}
        className={`w-full cursor-pointer appearance-none rounded-lg border py-3 pr-10 pl-4 text-base shadow-sm transition-colors focus:outline-none ${
          value
            ? "border-line bg-card font-medium text-ink focus:border-adm-500"
            : "border-line bg-card text-ink-faint focus:border-adm-500"
        }`}
      >
        <option value="" disabled>
          Sélectionner un type d'événement
        </option>
        {types.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-faint"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}