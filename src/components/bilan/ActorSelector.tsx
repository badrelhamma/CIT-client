import type { ActorDef } from "@/types";

interface ActorSelectorProps {
  actors: ActorDef[];
  selected: string[];
  onToggle: (id: string) => void;
}

export function ActorSelector({ actors, selected, onToggle }: ActorSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actors.map((actor) => {
        const active = selected.includes(actor.id);
        return (
          <button
            key={actor.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(actor.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-base transition-colors ${
              active
                ? "border-adm-600 bg-adm-600 text-white shadow-sm"
                : "border-line bg-card text-ink-soft hover:border-adm-300 hover:bg-adm-50"
            }`}
          >
            {actor.label}
          </button>
        );
      })}
    </div>
  );
}