import type { RefObject } from "react";
import { formatPk } from "@/services/location";

interface PkInputProps {
  value: string;
  onChange: (value: string) => void;
  validPk: number | null;
  onEnter: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function PkInput({
  value,
  onChange,
  validPk,
  onEnter,
  inputRef,
}: PkInputProps) {
  const trimmed = value.trim();
  const hasValue = trimmed.length > 0;
  const valid = hasValue && validPk !== null;

  return (
    <div>
      <div className="relative">
        <input
          ref={inputRef}
          id="pk-input"
          aria-label="PK"
          autoComplete="off"
          inputMode="decimal"
          placeholder="358+070"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter();
            }
          }}
          className={`w-full rounded-lg border py-3.5 pr-11 pl-4 font-mono text-xl font-semibold tabular-nums shadow-sm transition-colors focus:outline-none ${
            valid
              ? "border-ok bg-card text-ink focus:border-ok"
              : hasValue
                ? "border-red bg-card text-ink focus:border-red"
                : "border-line bg-card text-ink focus:border-adm-500"
          }`}
        />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-ink-faint"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      {hasValue &&
        (valid ? (
          <p
            role="status"
            className="mt-2 flex items-center gap-1.5 text-base font-medium text-ok"
          >
            <svg
              aria-hidden="true"
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            PK {formatPk(validPk)}
          </p>
        ) : (
          <p
            role="alert"
            className="mt-2 text-base font-medium text-red-deep"
          >
            PK invalide pour l'axe sélectionné.
          </p>
        ))}
    </div>
  );
}