import type { ScreenId } from "@/types";

export interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  children?: { id: ScreenId; label: string }[];
}

export const NAV_ITEMS: Omit<NavItem, "badge">[] = [
  {
    id: "historique",
    label: "Historique",
    icon: <HistoryIcon />,
    children: [
      { id: "historiqueTous", label: "Tous" },
      { id: "historiqueEncours", label: "En cours" },
      { id: "historiqueResolus", label: "Résolus" },
    ],
  },
  { id: "recherche", label: "Recherche", icon: <SearchIcon /> },
  { id: "bilan", label: "Bilan", icon: <BilanIcon /> },
  { id: "repertoire", label: "Répertoire", icon: <DirectoryIcon /> },
  { id: "tmd", label: "TMD", icon: <TmdIcon /> },
  { id: "criticite", label: "Criticité", icon: <CriticiteIcon /> },
  { id: "reseau", label: "Réseau", icon: <NetworkIcon /> },
  {
    id: "compteRendu",
    label: "Compte rendu",
    icon: <ReportIcon />,
    children: [
      { id: "listeCr", label: "Listes CR" },
      { id: "ajouterCr", label: "Ajouter CR" },
    ],
  },
];

export function navGroupActive(item: NavItem, active: ScreenId): boolean {
  if (item.id === active) return true;
  return (item.children ?? []).some((child) => child.id === active);
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function BilanIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function DirectoryIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="8" />
      <line x1="12" y1="16" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
      <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="8" y2="12" />
      <line x1="16" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function TmdIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2c-4 4-6 6-6 10a6 6 0 0 0 12 0c0-4-2-6-6-10Z" />
      <path d="M10 16h4" />
      <path d="M12 12v2" />
    </svg>
  );
}

function CriticiteIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}