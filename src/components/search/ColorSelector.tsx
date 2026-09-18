import type { EventColorDef } from "@/types";

interface ColorSelectorProps {
  colors: EventColorDef[];
  value: EventColorDef | null;
  onChange: (color: EventColorDef) => void;
}

export function ColorSelector({ colors, value, onChange }: ColorSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => {
        const active = value?.id === color.id;
        return (
          <button
            key={color.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(color)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-base transition-colors ${
              active
                ? "border-adm-600 bg-adm-600 text-white shadow-sm"
                : "border-line bg-card text-ink-soft hover:border-adm-300 hover:bg-adm-50"
            }`}
            title={color.label}
          >
            <span aria-hidden="true">{color.emoji}</span>
            {color.label}
          </button>
        );
      })}
    </div>
  );
}