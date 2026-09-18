interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#f5aab3] bg-[#ffe3e6] px-6 py-6 text-center">
      <p className="text-sm font-semibold text-red-deep">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer text-xs font-medium text-red-deep underline underline-offset-2 hover:text-red"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}