interface DirectionSelectorProps {
  dirA: string;
  dirB: string;
  value: string;
  onChange: (value: string) => void;
}

export function DirectionSelector({
  dirA,
  dirB,
  value,
  onChange,
}: DirectionSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: dirA, key: "dirA" },
        { label: dirB, key: "dirB" },
      ].map((dir) => {
        const active = value === dir.label;
        return (
          <button
            key={dir.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(dir.label)}
            className={`truncate rounded-lg border px-4 py-3 text-base font-semibold transition-colors ${
              active
                ? "border-adm-600 bg-adm-600 text-white shadow-sm"
                : "border-line bg-card text-ink-soft hover:border-adm-300 hover:bg-adm-50"
            }`}
          >
            {dir.label}
          </button>
        );
      })}
    </div>
  );
}