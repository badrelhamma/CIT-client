import { useEffect, type ReactNode } from "react";

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Largeur maximale du panneau (défaut lg). */
  maxWidth?: string;
}

/** Fenêtre d'alerte façon Instagram : overlay sombre, panneau central
 *  défilable, fermeture par croix, Échap ou clic sur le fond. */
export function Dialog({
  title,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: DialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px]"
      />
      <div
        className={`relative w-full ${maxWidth} max-h-[85dvh] overflow-y-auto rounded-2xl bg-card shadow-2xl`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h3 className="font-display text-lg text-ink">{title}</h3>
          <button
            type="button"
            title="Fermer"
            onClick={onClose}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-adm-50 hover:text-adm-600"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}