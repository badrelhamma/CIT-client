interface LoadingStateProps {
  label: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center gap-2.5 px-6 py-8 text-ink-soft">
      <svg
        aria-hidden="true"
        className="size-4 animate-spin text-adm-500"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}