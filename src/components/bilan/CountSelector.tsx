interface CountSelectorProps {
  values: number[];
  value: number | null;
  onChange: (count: number) => void;
}

export function CountSelector({
  values,
  value,
  onChange,
}: CountSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((count) => {
        const active = value === count;
        return (
          <button
            key={count}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(count)}
            className={`inline-flex h-11 min-w-11 items-center justify-center rounded-full border px-4 text-base font-medium tabular-nums transition-colors ${
              active
                ? "border-adm-600 bg-adm-600 text-white shadow-sm"
                : "border-line bg-card text-ink-soft hover:border-adm-300 hover:bg-adm-50"
            }`}
          >
            {count}
          </button>
        );
      })}
    </div>
  );
}