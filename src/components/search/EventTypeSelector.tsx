import { SearchableSelect } from "@/components/base/SearchableSelect";
import type { RequestTypeDef } from "@/types";

interface EventTypeSelectorProps {
  types: RequestTypeDef[];
  value: RequestTypeDef | null;
  onChange: (type: RequestTypeDef) => void;
}

export function EventTypeSelector({
  types,
  value,
  onChange,
}: EventTypeSelectorProps) {
  const safeTypes = (types ?? []).filter(Boolean);
  return (
    <SearchableSelect
      id="event-type-select"
      ariaLabel="Type d'événement"
      value={value?.id ?? ""}
      onChange={(id) => {
        const type = safeTypes.find((t) => t?.id === id);
        if (type) onChange(type);
      }}
      placeholder="Sélectionner un type d'événement"
      searchPlaceholder="Filtrer les types…"
      options={safeTypes.map((t) => ({ value: t.id, label: t.label ?? t.id }))}
    />
  );
}
