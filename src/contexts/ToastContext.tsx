import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "ok" | "error" | "info" | "warn";

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toasts: ToastItem[];
  notify: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = nextId++;
      setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
      const timer = setTimeout(() => dismiss(id), 3200);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, notify }),
    [toasts, notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-20 z-50 flex flex-col gap-2 sm:bottom-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2.5 text-sm font-medium text-ink shadow-lg"
          >
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${
                t.tone === "ok"
                  ? "bg-ok"
                  : t.tone === "error"
                    ? "bg-red"
                    : t.tone === "warn"
                      ? "bg-orange"
                      : "bg-adm-500"
              }`}
            />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans un ToastProvider");
  return ctx;
}