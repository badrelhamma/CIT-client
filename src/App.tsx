import { AppShell } from "@/components/layout/AppShell";
import { DataProvider } from "@/contexts/DataContext";
import { EventProvider } from "@/contexts/EventContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { BilanScreen } from "@/screens/BilanScreen";
import { CompteRenduScreen } from "@/screens/CompteRenduScreen";
import { CriticiteScreen } from "@/screens/CriticiteScreen";
import { HistoryScreen } from "@/screens/HistoryScreen";
import { NetworkScreen } from "@/screens/NetworkScreen";
import { RepertoireScreen } from "@/screens/RepertoireScreen";
import { SearchScreen } from "@/screens/SearchScreen";
import { TmdScreen } from "@/screens/TmdScreen";
import type { ScreenId } from "@/types";

function renderScreen(screen: ScreenId, navigate: (s: ScreenId) => void) {
  switch (screen) {
    case "recherche":
      return <SearchScreen onNavigate={navigate} />;
    case "bilan":
      return <BilanScreen />;
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
  }
}

export default function App() {
  return (
    <ToastProvider>
      <DataProvider>
        <EventProvider>
          <AppShell>{(_screen, navigate) => renderScreen(_screen, navigate)}</AppShell>
        </EventProvider>
      </DataProvider>
    </ToastProvider>
  );
}