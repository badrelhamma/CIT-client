import { StrictMode, Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./theme/index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Élément #root introuvable");
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("CIT — erreur d'exécution :", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center"
        >
          <p className="font-display text-4xl text-adm-900">
            Une erreur est survenue
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-red-800">
            {String(this.state.error.message || this.state.error)}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 cursor-pointer rounded-lg bg-adm-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-adm-800"
          >
            Recharger l'application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);