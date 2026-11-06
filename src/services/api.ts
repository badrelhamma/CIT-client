import type {
  AdminPermissionCatalog,
  AdminUserPayload,
  AuthUser,
  Catalogs,
  HealthResponse,
  Highway,
  HistoryEvent,
  CriticiteData,
  TmdEntry,
  DirectoryEntry,
} from "@/types";

const apiBaseUrl: string = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (
      res.status === 401 &&
      typeof window !== "undefined" &&
      !path.endsWith("/login")
    ) {
      window.dispatchEvent(new Event("cit:unauthorized"));
    }
    throw new ApiError(
      body?.error || `Erreur serveur (${res.status})`,
      res.status,
    );
  }
  return res.json() as Promise<T>;
}

export const api = {
  login(identifier: string, password: string): Promise<{ user: AuthUser }> {
    return request<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  },

  forgotPassword(email: string): Promise<{ message: string }> {
    return request<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  logout(): Promise<{ ok: true }> {
    return request<{ ok: true }>("/api/auth/logout", { method: "POST" });
  },

  me(): Promise<{ user: AuthUser }> {
    return request<{ user: AuthUser }>("/api/auth/me");
  },

  adminUsers(): Promise<AuthUser[]> {
    return request<{ users: AuthUser[] }>("/api/admin/users").then(
      (body) => body.users,
    );
  },

  adminPermissions(): Promise<AdminPermissionCatalog> {
    return request<AdminPermissionCatalog>("/api/admin/permissions");
  },

  adminCreateUser(payload: AdminUserPayload): Promise<AuthUser> {
    return request<{ user: AuthUser }>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((body) => body.user);
  },

  adminUpdateUser(
    id: string,
    payload: AdminUserPayload,
  ): Promise<AuthUser> {
    return request<{ user: AuthUser }>(
      `/api/admin/users/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    ).then((body) => body.user);
  },

  health(): Promise<HealthResponse> {
    return request<HealthResponse>("/api/health");
  },

  highways(): Promise<Highway[]> {
    return request<Highway[]>("/api/highways");
  },

  highway(id: string): Promise<Highway> {
    return request<Highway>(`/api/highways/${encodeURIComponent(id)}`);
  },

  catalogs(): Promise<Catalogs> {
    return request<Catalogs>("/api/catalogs");
  },

  history(): Promise<HistoryEvent[]> {
    return request<HistoryEvent[]>("/api/history");
  },

  createHistory(payload: Partial<HistoryEvent>): Promise<HistoryEvent> {
    return request<HistoryEvent>("/api/history", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /** Ajoute un bilan / réponse embedded à l'événement (sans nouveau document). */
  replyHistory(
    id: string,
    payload: Partial<HistoryEvent>,
  ): Promise<HistoryEvent> {
    return request<HistoryEvent>(`/api/history/${encodeURIComponent(id)}/reply`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  addHistoryComment(id: string, text: string): Promise<HistoryEvent> {
    return request<HistoryEvent>(
      `/api/history/${encodeURIComponent(id)}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ text }),
      },
    );
  },

  updateHistory(id: string, patch: Partial<HistoryEvent>): Promise<HistoryEvent> {
    return request<HistoryEvent>(`/api/history/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
  },

  deleteHistory(id: string): Promise<{ deleted: true }> {
    return request<{ deleted: true }>(
      `/api/history/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  },

  clearHistory(): Promise<{ deletedMany: true }> {
    return request<{ deletedMany: true }>("/api/history", {
      method: "DELETE",
    });
  },

  tmd(): Promise<TmdEntry[]> {
    return request<TmdEntry[]>("/api/tmd");
  },

  tmdSearch(q: string): Promise<TmdEntry[]> {
    return request<TmdEntry[]>("/api/tmd/search?q=" + encodeURIComponent(q));
  },

  criticite(): Promise<CriticiteData> {
    return request<CriticiteData>("/api/criticite");
  },

  directory(): Promise<DirectoryEntry[]> {
    return request<DirectoryEntry[]>("/api/directory");
  },

  directorySearch(
    params: { q?: string; metier?: string; region?: string; axe?: string; pk?: string } = {},
  ): Promise<DirectoryEntry[]> {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && value.trim().length > 0) qs.set(key, value);
    }
    const suffix = qs.size ? "?" + qs.toString() : "";
    return request<DirectoryEntry[]>("/api/directory/search" + suffix);
  },
};