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
    "bg-adm-700 text-white hover:bg-adm-800 active:bg-adm-900 disabled:bg-adm-300",
  secondary:
    "border border-line bg-card text-ink hover:bg-adm-50 active:bg-adm-100 disabled:text-ink-faint disabled:bg-card",
  ghost:
    "text-adm-700 hover:bg-adm-50 active:bg-adm-100 disabled:text-ink-faint disabled:bg-transparent",
  danger:
    "bg-red-deep text-white hover:bg-red active:bg-red-deep disabled:bg-red/40",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-2",
  md: "h-12 px-5 text-base gap-2",
  lg: "h-14 px-7 text-base gap-2.5",
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
      className={`inline-flex cursor-pointer items-center justify-center rounded-lg font-semibold transition-colors duration-150 select-none disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}