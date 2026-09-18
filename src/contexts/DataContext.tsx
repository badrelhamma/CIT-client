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
import type { Catalogs, Highway, HistoryEvent } from "@/types";

interface DataContextValue {
  highways: Highway[];
  catalogs: Catalogs | null;
  history: HistoryEvent[];
  healthOk: boolean | null;
  loadingHighways: boolean;
  loadingCatalogs: boolean;
  loadingHistory: boolean;
  errorHighways: string | null;
  errorCatalogs: string | null;
  errorHistory: string | null;
  refreshHistory: () => Promise<void>;
  checkHealth: () => Promise<void>;
  highwayById: (id: string) => Highway | undefined;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [highways, setHighways] = useState<Highway[]>([]);
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);

  const [loadingHighways, setLoadingHighways] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [errorHighways, setErrorHighways] = useState<string | null>(null);
  const [errorCatalogs, setErrorCatalogs] = useState<string | null>(null);
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
    setLoadingHistory(true);
    setErrorHistory(null);
    try {
      const items = await api.history();
      if (mounted.current) setHistory(items);
    } catch {
      if (mounted.current) setErrorHistory("Impossible de charger l'historique.");
    } finally {
      if (mounted.current) setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    setLoadingHighways(true);
    setErrorHighways(null);
    api
      .highways()
      .then((h) => {
        if (mounted.current) setHighways(h);
      })
      .catch(() => {
        if (mounted.current) setErrorHighways("Impossible de charger les axes.");
      })
      .finally(() => {
        if (mounted.current) setLoadingHighways(false);
      });
  }, []);

  useEffect(() => {
    setLoadingCatalogs(true);
    setErrorCatalogs(null);
    api
      .catalogs()
      .then((c) => {
        if (mounted.current) setCatalogs(c);
      })
      .catch(() => {
        if (mounted.current)
          setErrorCatalogs("Impossible de charger les référentiels.");
      })
      .finally(() => {
        if (mounted.current) setLoadingCatalogs(false);
      });
  }, []);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  const highwayById = useCallback(
    (id: string) => highways.find((h) => h.id === id),
    [highways],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      highways,
      catalogs,
      history,
      healthOk,
      loadingHighways,
      loadingCatalogs,
      loadingHistory,
      errorHighways,
      errorCatalogs,
      errorHistory,
      refreshHistory,
      checkHealth,
      highwayById,
    }),
    [
      highways,
      catalogs,
      history,
      healthOk,
      loadingHighways,
      loadingCatalogs,
      loadingHistory,
      errorHighways,
      errorCatalogs,
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