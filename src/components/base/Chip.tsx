import type { ReactNode } from "react";

type Tone = "neutral" | "adm" | "ok" | "warn" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-paper text-ink-soft border-line",
  adm: "bg-adm-100 text-adm-800 border-adm-300",
  ok: "bg-ok/10 text-ok border-ok/30",
  warn: "bg-orange/10 text-orange border-orange/40",
  danger: "bg-red/10 text-red-deep border-red/30",
};

interface ChipProps {
  children: ReactNode;
  tone?: Tone;
  active?: boolean;
  onClick?: () => void;
  selected?: boolean;
  title?: string;
}

export function Chip({
  children,
  tone = "neutral",
  active = false,
  selected = false,
  onClick,
  title,
}: ChipProps) {
  const interactive = onClick !== undefined;
  const base = `inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-base font-medium whitespace-nowrap transition-colors duration-150 ${toneClasses[tone]}`;
  const state = selected
    ? "border-adm-600 bg-adm-600 text-white"
    : active
      ? "border-adm-500 bg-adm-500 text-white"
      : interactive
        ? "cursor-pointer hover:border-adm-300 hover:bg-adm-50"
        : "";

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={!interactive}
      className={`${base} ${state} ${interactive ? "" : "cursor-default"}`}
    >
      {children}
    </button>
  );
}