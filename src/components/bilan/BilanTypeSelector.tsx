import { SearchableSelect } from "@/components/base/SearchableSelect";
import type { BilanTypeDef } from "@/types";

interface BilanTypeSelectorProps {
  templates: BilanTypeDef[];
  value: BilanTypeDef | null;
  onChange: (type: BilanTypeDef) => void;
}

export function BilanTypeSelector({
  templates,
  value,
  onChange,
}: BilanTypeSelectorProps) {
  const safe = (templates ?? []).filter(Boolean);
  return (
    <SearchableSelect
      id="bilan-type-select"
      ariaLabel="Type de bilan"
      value={value?.id ?? ""}
      onChange={(id) => {
        const type = safe.find((t) => t?.id === id);
        if (type) onChange(type);
      }}
      placeholder="Sélectionner un type de bilan"
      searchPlaceholder="Filtrer les bilans…"
      options={safe.map((t) => ({
        value: t.id,
        label: t.id === "autres" ? "Autres" : (t.template ?? t.id),
      }))}
    />
  );
}
