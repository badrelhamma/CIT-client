import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/base/LoadingState";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { EventProvider } from "@/contexts/EventContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { AdminScreen } from "@/screens/AdminScreen";
import { CompteRenduScreen } from "@/screens/CompteRenduScreen";
import { CriticiteScreen } from "@/screens/CriticiteScreen";
import { EventScreen } from "@/screens/EventScreen";
import { HistoryScreen } from "@/screens/HistoryScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { NetworkScreen } from "@/screens/NetworkScreen";
import { RepertoireScreen } from "@/screens/RepertoireScreen";
import { TmdScreen } from "@/screens/TmdScreen";
import type { ScreenId } from "@/types";

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
        <AppShell>{(screen) => renderScreen(screen)}</AppShell>
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