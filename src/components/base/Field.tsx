import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-base font-medium text-ink-soft"
      >
        {label}
      </label>
      {children}
    </div>
  );
}