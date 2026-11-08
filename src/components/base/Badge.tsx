import type { ReactNode } from "react";

type Tone = "adm" | "ok" | "warn" | "danger" | "neutral";

const toneClasses: Record<Tone, string> = {
  adm: "tint-fill",
  ok: "bg-ok/15 text-ok",
  warn: "bg-orange/15 text-orange",
  danger: "bg-red/15 text-red-deep",
  neutral: "bg-card-2 text-ink-soft",
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ children, tone = "neutral", dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {dot && (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}