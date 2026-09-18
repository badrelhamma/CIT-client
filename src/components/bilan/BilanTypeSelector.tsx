import type { BilanTypeDef } from "@/types";

interface BilanTypeSelectorProps {
  templates: BilanTypeDef[];
  value: BilanTypeDef | null;
  onChange: (type: BilanTypeDef) => void;
}

export function BilanTypeSelector({
  templates,
  value,
  onChange,
}: BilanTypeSelectorProps) {
  return (
    <div className="relative">
      <select
        id="bilan-type-select"
        aria-label="Type de bilan"
        value={value?.id ?? ""}
        onChange={(e) => {
          const type = templates.find((t) => t.id === e.target.value);
          if (type) onChange(type);
        }}
        className={`w-full cursor-pointer appearance-none rounded-lg border py-3 pr-10 pl-4 text-base shadow-sm transition-colors focus:outline-none ${
          value
            ? "border-line bg-card font-medium text-ink focus:border-adm-500"
            : "border-line bg-card text-ink-faint focus:border-adm-500"
        }`}
      >
        <option value="" disabled>
          Sélectionner un type de bilan
        </option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.id === "autres" ? "Autres" : t.template}
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