import { useData } from "@/contexts/DataContext";
import { LoadingState } from "@/components/base/LoadingState";
import { ErrorState } from "@/components/base/ErrorState";

interface HighwaySelectorProps {
  value: string;
  onChange: (id: string) => void;
  /** IDs d'axes à afficher, dans l'ordre souhaité. Par défaut : tous. */
  allowedIds?: string[];
}

export function HighwaySelector({
  value,
  onChange,
  allowedIds,
}: HighwaySelectorProps) {
  const { highways, loadingHighways, errorHighways } = useData();

  if (loadingHighways) return <LoadingState label="Chargement des axes..." />;

  if (errorHighways || highways.length === 0) {
    return <ErrorState message="Impossible de charger les axes." />;
  }

  const visible =
    allowedIds && allowedIds.length > 0
      ? allowedIds
          .map((id) => highways.find((h) => h.id === id))
          .filter((h): h is NonNullable<typeof h> => Boolean(h))
      : highways;

  return (
    <div className="relative">
      <select
        id="highway-select"
        aria-label="Autoroute"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-lg border border-line bg-card py-3 pr-10 pl-4 text-base text-ink shadow-sm transition-colors hover:border-adm-300 focus:border-adm-500 focus:outline-none"
      >
        {visible.map((h) => (
          <option key={h.id} value={h.id}>
            {h.id} · {h.name} · {h.lengthKm} km
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