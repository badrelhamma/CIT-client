import { Suspense, lazy } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/base/LoadingState";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { EventProvider } from "@/contexts/EventContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { LoginScreen } from "@/screens/LoginScreen";
import type { ScreenId } from "@/types";

const AdminScreen = lazy(() =>
  import("@/screens/AdminScreen").then((m) => ({ default: m.AdminScreen })),
);
const CompteRenduScreen = lazy(() =>
  import("@/screens/CompteRenduScreen").then((m) => ({
    default: m.CompteRenduScreen,
  })),
);
const CriticiteScreen = lazy(() =>
  import("@/screens/CriticiteScreen").then((m) => ({
    default: m.CriticiteScreen,
  })),
);
const EventScreen = lazy(() =>
  import("@/screens/EventScreen").then((m) => ({ default: m.EventScreen })),
);
const HistoryScreen = lazy(() =>
  import("@/screens/HistoryScreen").then((m) => ({ default: m.HistoryScreen })),
);
const NetworkScreen = lazy(() =>
  import("@/screens/NetworkScreen").then((m) => ({
    default: m.NetworkScreen,
  })),
);
const RepertoireScreen = lazy(() =>
  import("@/screens/RepertoireScreen").then((m) => ({
    default: m.RepertoireScreen,
  })),
);
const TmdScreen = lazy(() =>
  import("@/screens/TmdScreen").then((m) => ({ default: m.TmdScreen })),
);

function renderScreen(screen: ScreenId) {
  switch (screen) {
    case "evenement":
      return <EventScreen />;
    case "historique":
    case "historiqueTous":
      return <HistoryScreen key="tous" initialTab="tous" />;
    case "historiqueEncours":
      return <HistoryScreen key="encours" initialTab="encours" />;
    case "historiqueResolus":
      return <HistoryScreen key="resolus" initialTab="resolus" />;
    case "reseau":
      return <NetworkScreen />;
    case "repertoire":
      return <RepertoireScreen />;
    case "tmd":
      return <TmdScreen />;
    case "criticite":
      return <CriticiteScreen />;
    case "compteRendu":
    case "listeCr":
      return <CompteRenduScreen key="liste" initialView="liste" />;
    case "ajouterCr":
      return <CompteRenduScreen key="ajouter" initialView="ajouter" />;
    case "administration":
      return <AdminScreen />;
  }
}

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <LoadingState label="Vérification de la session…" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <DataProvider>
      <EventProvider>
        <AppShell>
          {(screen) => (
            <Suspense
              fallback={
                <div className="flex min-h-[40vh] items-center justify-center">
                  <LoadingState label="Chargement…" />
                </div>
              }
            >
              {renderScreen(screen)}
            </Suspense>
          )}
        </AppShell>
      </EventProvider>
    </DataProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ToastProvider>
  );
}
