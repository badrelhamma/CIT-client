import type { BilanVictimes } from "@/services/message";

interface VictimCounterProps {
  value: BilanVictimes;
  onChange: (next: BilanVictimes) => void;
}

const FIELDS: { key: keyof BilanVictimes; label: string; hint: string }[] = [
  { key: "bl", label: "BL", hint: "Blessés légers" },
  { key: "bg", label: "BG", hint: "Blessés graves" },
  { key: "tues", label: "Tués", hint: "Décédés" },
];

function clamp(n: number): number {
  return Math.min(99, Math.max(0, n));
}

export function VictimCounter({ value, onChange }: VictimCounterProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {FIELDS.map((field) => (
        <div
          key={field.key}
          className="flex flex-col items-center rounded-lg border border-line bg-card px-3 py-4"
        >
          <span className="text-lg font-extrabold text-ink">
            {field.label}
          </span>
          <span className="mt-1 text-xs text-ink-faint">{field.hint}</span>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              aria-label={`Diminuer ${field.label}`}
              onClick={() =>
                onChange({ ...value, [field.key]: clamp(value[field.key] - 1) })
              }
              className="flex size-10 items-center justify-center rounded-full border border-line bg-adm-50 text-xl font-extrabold text-adm-700 transition-colors hover:bg-adm-100"
            >
              −
            </button>
            <span className="w-9 text-center text-2xl font-extrabold text-ink tabular-nums">
              {value[field.key]}
            </span>
            <button
              type="button"
              aria-label={`Augmenter ${field.label}`}
              onClick={() =>
                onChange({ ...value, [field.key]: clamp(value[field.key] + 1) })
              }
              className="flex size-10 items-center justify-center rounded-full border border-line bg-adm-50 text-xl font-extrabold text-adm-700 transition-colors hover:bg-adm-100"
            >
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}