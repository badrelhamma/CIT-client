import { useData } from "@/contexts/DataContext";
import { LoadingState } from "@/components/base/LoadingState";
import { ErrorState } from "@/components/base/ErrorState";
import { SearchableSelect } from "@/components/base/SearchableSelect";

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

  if (errorHighways || (highways ?? []).length === 0) {
    return <ErrorState message="Impossible de charger les axes." />;
  }

  const safeHighways = highways ?? [];
  const visible =
    allowedIds && allowedIds.length > 0
      ? allowedIds
          .map((id) => safeHighways.find((h) => h?.id === id))
          .filter((h): h is NonNullable<typeof h> => Boolean(h?.id))
      : safeHighways.filter((h) => Boolean(h?.id));

  return (
    <SearchableSelect
      id="highway-select"
      ariaLabel="Autoroute"
      value={value ?? ""}
      onChange={onChange}
      placeholder="Sélectionner un axe"
      searchPlaceholder="Filtrer les axes (ex. A1, Rabat…)"
      options={visible.map((h) => ({
        value: h.id,
        label: `${h.id} · ${h.name ?? ""} · ${h.lengthKm ?? ""} km`.trim(),
      }))}
    />
  );
}
