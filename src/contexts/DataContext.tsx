import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { CATALOGS_DATA, HIGHWAYS_DATA } from "@/services/localData";
import type { Catalogs, Highway, HistoryEvent } from "@/types";

interface DataContextValue {
  highways: Highway[];
  catalogs: Catalogs;
  history: HistoryEvent[];
  healthOk: boolean | null;
  loadingHistory: boolean;
  errorHistory: string | null;
  refreshHistory: () => Promise<void>;
  checkHealth: () => Promise<void>;
  highwayById: (id: string) => Highway | undefined;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { hasPermission } = useAuth();
  const canViewHistory = hasPermission("page:historique");
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const h = await api.health();
      setHealthOk(h.status === "ok" && h.db === "connected");
    } catch {
      setHealthOk(false);
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    if (!canViewHistory) {
      if (mounted.current) {
        setHistory([]);
        setErrorHistory(null);
        setLoadingHistory(false);
      }
      return;
    }
    setLoadingHistory(true);
    setErrorHistory(null);
    try {
      const result = await api.history();
      if (mounted.current) {
        setHistory(Array.isArray(result) ? result : []);
      }
    } catch {
      if (mounted.current) setErrorHistory("Impossible de charger l'historique.");
    } finally {
      if (mounted.current) setLoadingHistory(false);
    }
  }, [canViewHistory]);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    if (canViewHistory) {
      void refreshHistory();
    } else {
      setHistory([]);
      setErrorHistory(null);
      setLoadingHistory(false);
    }
  }, [canViewHistory, refreshHistory]);

  const highwayById = useCallback(
    (id: string) => HIGHWAYS_DATA.find((h) => h.id === id),
    [],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      highways: HIGHWAYS_DATA,
      catalogs: CATALOGS_DATA,
      history,
      healthOk,
      loadingHistory,
      errorHistory,
      refreshHistory,
      checkHealth,
      highwayById,
    }),
    [
      history,
      healthOk,
      loadingHistory,
      errorHistory,
      refreshHistory,
      checkHealth,
      highwayById,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData doit être utilisé dans un DataProvider");
  return ctx;
}
