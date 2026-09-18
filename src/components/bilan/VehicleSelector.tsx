interface VehicleSelectorProps {
  vehicles: string[];
  selected: string[];
  max: number;
  onToggle: (vehicle: string) => void;
}

export function VehicleSelector({
  vehicles,
  selected,
  max,
  onToggle,
}: VehicleSelectorProps) {
  const atLimit = selected.length >= max;

  return (
    <div className="flex flex-wrap gap-2">
      {vehicles.map((vehicle) => {
        const active = selected.includes(vehicle);
        const disabled = !active && atLimit;
        return (
          <button
            key={vehicle}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onToggle(vehicle)}
            title={`Sélectionner ${vehicle}`}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-base transition-colors ${
              active
                ? "border-adm-600 bg-adm-600 text-white shadow-sm"
                : disabled
                  ? "cursor-not-allowed border-line bg-card text-ink-faint"
                  : "border-line bg-card text-ink-soft hover:border-adm-300 hover:bg-adm-50"
            }`}
          >
            {vehicle}
          </button>
        );
      })}
    </div>
  );
}