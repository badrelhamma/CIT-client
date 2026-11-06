import { EVENT_STATES, type EventStateId } from "@/services/eventState";

interface EventStateSelectorProps {
  value: EventStateId;
  onChange: (state: EventStateId) => void;
}

export function EventStateSelector({
  value,
  onChange,
}: EventStateSelectorProps) {
  return (
    <div
      role="group"
      aria-label="État de l'événement"
      className="flex flex-wrap gap-2"
    >
      {EVENT_STATES.map((state) => {
        const active = value === state.id;
        return (
          <button
            key={state.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(state.id)}
            className={`inline-flex items-center rounded-full border px-4 py-2.5 text-base transition-colors ${
              active
                ? "border-adm-600 bg-adm-600 text-white shadow-sm"
                : "border-line bg-card text-ink-soft hover:border-adm-300 hover:bg-adm-50"
            }`}
          >
            {state.label}
          </button>
        );
      })}
    </div>
  );
}
