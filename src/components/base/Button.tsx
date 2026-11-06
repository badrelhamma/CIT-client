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
    "ig-gradient text-white hover:brightness-105 active:brightness-95 disabled:opacity-50",
  secondary:
    "border border-ig-border-strong bg-transparent text-ig-blue hover:bg-ig-surface-2 active:bg-ig-surface-2 disabled:text-ink-faint disabled:bg-card-2",
  ghost:
    "text-ig-blue hover:bg-ig-surface-2 active:bg-ig-surface-2 disabled:text-ink-faint disabled:bg-transparent",
  danger:
    "bg-red text-white hover:bg-red-deep active:bg-red-deep disabled:bg-red/40 disabled:text-white/70",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-2",
  md: "h-11 px-5 text-base gap-2",
  lg: "h-14 px-7 text-lg gap-2.5",
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
