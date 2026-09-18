interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line bg-card/60 px-6 py-10 text-center">
      <svg
        aria-hidden="true"
        className="size-8 text-ink-faint/60"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z"
        />
      </svg>
      <p className="font-semibold text-ink">{title}</p>
      {description && (
        <p className="max-w-xs text-sm text-ink-faint">{description}</p>
      )}
    </div>
  );
}