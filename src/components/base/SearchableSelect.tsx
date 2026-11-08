import { useMemo, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  id?: string;
  ariaLabel: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

function normalize(v: string): string {
  return (v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function SearchableSelect({
  id,
  ariaLabel,
  value,
  options,
  onChange,
  placeholder = "Sélectionner…",
  searchPlaceholder = "Filtrer…",
  disabled = false,
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");

  const safeValue = value ?? "";
  const safeOptions = useMemo(
    () =>
      (options ?? []).filter(
        (o): o is SelectOption =>
          Boolean(o) && o.value != null && o.label != null,
      ),
    [options],
  );

  const showSearch = safeOptions.length > 8;

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return safeOptions;
    return safeOptions.filter((o) => normalize(o.label).includes(q));
  }, [safeOptions, query]);

  const hasMatch = safeValue !== "" && safeOptions.some((o) => o.value === safeValue);
  const selectValue = hasMatch ? safeValue : safeOptions.some((o) => o.value === safeValue) ? safeValue : safeValue !== "" && showSearch ? "" : safeValue;

  return (
    <div className="min-w-0">
      {showSearch && (
        <div className="relative mb-2">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint">
            <svg
              aria-hidden="true"
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            aria-label={`${ariaLabel} — filtrer les options`}
            autoComplete="off"
            inputMode="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full min-h-11 rounded-lg border border-line bg-paper py-2.5 pr-3 pl-9 text-base text-ink shadow-sm transition-colors focus:border-adm-500 focus:outline-none"
          />
        </div>
      )}
      <div className="relative">
        <select
          id={id}
          aria-label={ariaLabel}
          value={selectValue}
          disabled={disabled || filtered.length === 0}
          onChange={(e) => onChange(e.target.value ?? "")}
          className="w-full min-h-12 cursor-pointer appearance-none rounded-lg border border-line bg-card py-3 pr-10 pl-4 text-base text-ink shadow-sm transition-colors hover:border-adm-300 focus:border-adm-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {filtered.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
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
      {showSearch && filtered.length === 0 && (
        <p className="mt-1.5 text-xs text-ink-faint">
          Aucun résultat pour « {query} ».
        </p>
      )}
      {showSearch && query && filtered.length > 0 && (
        <p className="mt-1.5 text-xs text-ink-faint tabular-nums">
          {filtered.length} / {safeOptions.length} options
        </p>
      )}
    </div>
  );
}
