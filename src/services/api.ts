import { apiUrl } from "@/config/api";
import type {
  AdminPermissionCatalog,
  AdminUserPayload,
  AuthUser,
  CatalogEntry,
  Catalogs,
  HealthResponse,
  Highway,
  HistoryEvent,
  CriticiteData,
  TmdEntry,
  DirectoryEntry,
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

function emptyCatalogs(): Catalogs {
  const entry = <T,>(data: T): CatalogEntry<T> => ({
    version: "",
    data,
    seededAt: "",
  });
  return {
    lanes: entry([]),
    trafficImpacts: entry([]),
    damageTypes: entry([]),
    actionActors: entry([]),
    actionStatuses: entry([]),
    vehicleTypes: entry([]),
    maxVehicleChoices: entry(3),
    countValues: entry([]),
    bilanTypeTemplates: entry([]),
    eventColors: entry([]),
    requestTypes: entry([]),
    detectionSources: entry([]),
    statuses: entry([]),
    landmarkTypeMeta: entry({} as Catalogs["landmarkTypeMeta"]["data"]),
    pendingAxes: entry([]),
    networkStats: entry({
      highways: 0,
      pending: 0,
      totalKm: 0,
      landmarks: 0,
    }),
  };
}

function normalizeCatalogEntry<T>(
  raw: unknown,
  fallback: T,
): CatalogEntry<T> {
  if (raw === null || raw === undefined) {
    return { version: "", data: fallback, seededAt: "" };
  }
  if (
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    "data" in (raw as Record<string, unknown>)
  ) {
    const obj = raw as { version?: unknown; data?: T; seededAt?: unknown };
    return {
      version: typeof obj.version === "string" ? obj.version : "",
      data: (obj.data ?? fallback) as T,
      seededAt: typeof obj.seededAt === "string" ? obj.seededAt : "",
    };
  }
  // Référentiel renvoyé directement (sans enveloppe { version, data, seededAt }).
  return { version: "", data: raw as T, seededAt: "" };
}

/** Normalise la réponse des référentiels et garantit la présence de chaque clé. */
export function normalizeCatalogs(raw: unknown): Catalogs {
  const base = emptyCatalogs();
  const source = unwrap<Record<string, unknown>>(raw, ["data", "catalogs"], {});
  if (!source || typeof source !== "object") return base;
  return {
    lanes: normalizeCatalogEntry(source.lanes, base.lanes.data),
    trafficImpacts: normalizeCatalogEntry(
      source.trafficImpacts,
      base.trafficImpacts.data,
    ),
    damageTypes: normalizeCatalogEntry(
      source.damageTypes,
      base.damageTypes.data,
    ),
    actionActors: normalizeCatalogEntry(
      source.actionActors,
      base.actionActors.data,
    ),
    actionStatuses: normalizeCatalogEntry(
      source.actionStatuses,
      base.actionStatuses.data,
    ),
    vehicleTypes: normalizeCatalogEntry(
      source.vehicleTypes,
      base.vehicleTypes.data,
    ),
    maxVehicleChoices: normalizeCatalogEntry(
      source.maxVehicleChoices,
      base.maxVehicleChoices.data,
    ),
    countValues: normalizeCatalogEntry(
      source.countValues,
      base.countValues.data,
    ),
    bilanTypeTemplates: normalizeCatalogEntry(
      source.bilanTypeTemplates,
      base.bilanTypeTemplates.data,
    ),
    eventColors: normalizeCatalogEntry(
      source.eventColors,
      base.eventColors.data,
    ),
    requestTypes: normalizeCatalogEntry(
      source.requestTypes,
      base.requestTypes.data,
    ),
    detectionSources: normalizeCatalogEntry(
      source.detectionSources,
      base.detectionSources.data,
    ),
    statuses: normalizeCatalogEntry(source.statuses, base.statuses.data),
    landmarkTypeMeta: normalizeCatalogEntry(
      source.landmarkTypeMeta,
      base.landmarkTypeMeta.data,
    ),
    pendingAxes: normalizeCatalogEntry(
      source.pendingAxes,
      base.pendingAxes.data,
    ),
    networkStats: normalizeCatalogEntry(
      source.networkStats,
      base.networkStats.data,
    ),
  };
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

  highways(): Promise<Highway[]> {
    return request<unknown>("/api/highways").then((body) =>
      toArray<Highway>(body, ["data", "highways", "items"]),
    );
  },

  highway(id: string): Promise<Highway> {
    return request<Highway>(`/api/highways/${encodeURIComponent(id)}`);
  },

  catalogs(): Promise<Catalogs> {
    return request<unknown>("/api/catalogs").then(normalizeCatalogs);
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