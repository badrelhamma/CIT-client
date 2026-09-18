import type { LaneDef } from "@/types";

interface LaneSelectorProps {
  lanes: LaneDef[];
  selected: string[];
  onToggle: (id: string) => void;
}

export function LaneSelector({ lanes, selected, onToggle }: LaneSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {lanes.map((lane) => {
        const active = selected.includes(lane.id);
        return (
          <button
            key={lane.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(lane.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-base transition-colors ${
              active
                ? "border-adm-600 bg-adm-600 text-white shadow-sm"
                : "border-line bg-card text-ink-soft hover:border-adm-300 hover:bg-adm-50"
            }`}
          >
            {lane.label}
          </button>
        );
      })}
    </div>
  );
}