import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "ig-gradient text-white shadow-[0_8px_24px_rgba(225,48,108,.35)] hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:shadow-none",
  secondary:
    "border border-ig-blue/40 bg-transparent text-ig-blue hover:bg-ig-blue/10 active:bg-ig-blue/15 disabled:text-ink-faint disabled:border-line disabled:bg-transparent",
  ghost:
    "text-ig-blue hover:bg-ig-blue/10 active:bg-ig-blue/15 disabled:text-ink-faint disabled:bg-transparent",
  danger:
    "bg-red text-white hover:brightness-110 active:brightness-95 disabled:bg-red/40 disabled:text-white/70",
};

const sizeClasses: Record<Size, string> = {
  sm: "min-h-10 px-4 text-sm gap-2",
  md: "min-h-11 px-5 text-base gap-2",
  lg: "min-h-14 px-7 text-lg gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`pressable inline-flex cursor-pointer items-center justify-center rounded-[var(--radius-capsule)] font-semibold select-none disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
