import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, api } from "@/services/api";
import {
  hasPermission as checkPermission,
  isPrincipal as checkPrincipal,
} from "@/services/access";
import type { AuthUser, PermissionKey } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  hasPermission: (permission: PermissionKey) => boolean;
  isPrincipal: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      const body = await api.me();
      setUser(body.user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de vérifier la session.",
        );
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("cit:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("cit:unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const body = await api.login(identifier.trim(), password);
    setUser(body.user);
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback(
    (permission: PermissionKey) => checkPermission(user, permission),
    [user],
  );

  const isPrincipal = checkPrincipal(user);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      refresh,
      hasPermission,
      isPrincipal,
    }),
    [user, loading, error, login, logout, refresh, hasPermission, isPrincipal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
