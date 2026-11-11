import { apiUrl } from "@/config/api";
import type {
  AdminPermissionCatalog,
  AdminUserPayload,
  AuthUser,
  HealthResponse,
  HistoryEvent,
} from "@/types";

export class ApiError extends Error {
  status: number;
  url?: string;

  constructor(message: string, status: number, url?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
  }
}

/**
 * Extrait la valeur utile d'une réponse API quel que soit son emballage :
 * tableau direct, `{ data: ... }`, `{ highways: ... }`, `{ events: ... }`, etc.
 */
function unwrap<T>(body: unknown, keys: string[], fallback: T): T {
  if (body === null || body === undefined) return fallback;
  if (Array.isArray(body)) return body as unknown as T;
  if (typeof body === "object") {
    const obj = body as Record<string, unknown>;
    for (const key of keys) {
      const value = obj[key];
      if (value !== undefined && value !== null) return value as T;
    }
    return body as T;
  }
  return fallback;
}

function toArray<T>(body: unknown, keys: string[]): T[] {
  const value = unwrap<unknown>(body, keys, []);
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Normalise `{ user }`, `{ data: { user } }`, `{ data: user }` ou l'utilisateur brut. */
function normalizeUserBody(body: unknown): { user: AuthUser } {
  if (body === null || body === undefined) {
    return { user: null as unknown as AuthUser };
  }
  if (typeof body !== "object") {
    return { user: body as AuthUser };
  }
  const obj = body as Record<string, unknown>;
  const data =
    obj.data && typeof obj.data === "object"
      ? (obj.data as Record<string, unknown>)
      : undefined;
  const user =
    obj.user ??
    data?.user ??
    (data && "id" in data ? data : undefined) ??
    ("id" in obj ? obj : undefined);
  return { user: (user ?? null) as unknown as AuthUser };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = apiUrl(path);

  let res: Response;
  try {
    res = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      ...init,
    });
  } catch (err) {
    console.error(`[API] Requête réseau échouée vers ${url}`, err);
    throw new ApiError(
      "Serveur inaccessible. Il est peut-être en veille, réessayez dans quelques instants.",
      0,
      url,
    );
  }
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
    return request<unknown>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }).then(normalizeUserBody);
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
    return request<unknown>("/api/auth/me").then(normalizeUserBody);
  },

  adminUsers(): Promise<AuthUser[]> {
    return request<unknown>("/api/admin/users").then((body) =>
      toArray<AuthUser>(body, ["users", "data", "items"]),
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

  history(): Promise<HistoryEvent[]> {
    return request<unknown>("/api/history").then((body) =>
      toArray<HistoryEvent>(body, ["data", "events", "history", "items"]),
    );
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

  compteRendus(): Promise<unknown[]> {
    return request<unknown>("/api/reports").then((body) =>
      toArray<unknown>(body, ["data", "reports", "items", "compteRendus"]),
    );
  },

  createCompteRendu(state: Record<string, unknown>): Promise<unknown> {
    return request<unknown>("/api/reports", {
      method: "POST",
      body: JSON.stringify({ state }),
    });
  },

  deleteCompteRendu(id: string): Promise<{ deleted: true }> {
    return request<{ deleted: true }>(
      `/api/reports/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  },
};