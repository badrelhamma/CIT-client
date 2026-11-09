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

function asTrimmedString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * Normalise une entrée TMD aux champs canoniques { onu, description, danger }.
 * Accepte les alias code_onu / nom / danger_id / code_danger, etc.
 */
export function normalizeTmdEntry(raw: unknown): TmdEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const onu = asTrimmedString(
    rec.onu ?? rec.code_onu ?? rec.codeOnu ?? rec.numero_onu ?? rec.numeroOnu ?? rec.id_onu ?? rec.id,
  );
  const description = asTrimmedString(
    rec.description ?? rec.nom ?? rec.designation ?? rec.name ?? rec.libelle,
  );
  const danger = asTrimmedString(
    rec.danger ?? rec.danger_id ?? rec.dangerId ?? rec.code_danger ?? rec.codeDanger ?? rec.numero_danger ?? rec.numeroDanger,
  );
  if (!onu && !description && !danger) return null;
  return { onu, description, danger };
}

function toTmdArray(body: unknown): TmdEntry[] {
  const direct = toArray<TmdEntry>(body, ["data", "tmd", "items", "entries"]);
  return direct
    .map((item) => normalizeTmdEntry(item))
    .filter((item): item is TmdEntry => item !== null);
}

function normalizeTmdList(body: unknown): Promise<TmdEntry[]> {
  return Promise.resolve(toTmdArray(body));
}

function filterTmdByQuery(entries: TmdEntry[], q: string): TmdEntry[] {
  const needle = asTrimmedString(q)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!needle) return entries;
  const includes = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(needle);
  return entries.filter(
    (r) => includes(r.onu) || includes(r.description) || includes(r.danger),
  );
}

const CRITICITE_LEVELS = ["Courant", "Critique", "Majeur"] as const;

function canonicalCriticiteLevel(key: string): string | null {
  const found = CRITICITE_LEVELS.find(
    (level) => level.toLowerCase() === key.trim().toLowerCase(),
  );
  return found ?? null;
}

function toCriterionString(value: unknown): string {
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    return asTrimmedString(
      rec.criterion ?? rec.critere ?? rec.label ?? rec.name ?? rec.value,
    );
  }
  return asTrimmedString(value);
}

/**
 * Normalise la criticité vers { Courant, Critique, Majeur }.
 * Accepte objet { Courant|Critique|Majeur }, objet en minuscules
 * { courant, critique, majeur }, enveloppes { data } / { criticite } /
 * { criteres }, et liste plate [{ level, criterion }].
 */
export function normalizeCriticiteData(body: unknown): CriticiteData {
  const result: CriticiteData = { Courant: [], Critique: [], Majeur: [] };
  if (Array.isArray(body)) {
    for (const item of body as Array<Record<string, unknown>>) {
      if (!item || typeof item !== "object") continue;
      const level = canonicalCriticiteLevel(
        asTrimmedString(item.level ?? item.niveau ?? item.categorie),
      ) as keyof CriticiteData | null;
      const criterion = toCriterionString(item);
      if (level && criterion && !result[level].includes(criterion)) {
        result[level].push(criterion);
      }
    }
    return result;
  }
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    const inner = obj.data ?? obj.criticite ?? obj.criteres;
    if (inner && typeof inner === "object" && inner !== obj) {
      return normalizeCriticiteData(inner);
    }
    for (const key of Object.keys(obj)) {
      const level = canonicalCriticiteLevel(key) as keyof CriticiteData | null;
      if (!level) continue;
      const list = obj[key];
      if (Array.isArray(list)) {
        result[level] = list
          .map((c) => toCriterionString(c))
          .filter(Boolean);
      }
    }
  }
  return result;
}

function isEmptyCriticite(data: CriticiteData): boolean {
  return (
    data.Courant.length === 0 &&
    data.Critique.length === 0 &&
    data.Majeur.length === 0
  );
}

async function fetchLocalJson(path: string): Promise<unknown> {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  try {
    const res = await fetch(`${normalizedBase}${path.replace(/^\//, "")}`);
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

async function fetchLocalTmdFallback(): Promise<TmdEntry[]> {
  const body = await fetchLocalJson("data/tmd.json");
  return toTmdArray(body);
}

async function fetchLocalCriticiteFallback(): Promise<CriticiteData> {
  const body = await fetchLocalJson("data/criticite.json");
  return normalizeCriticiteData(body);
}

/**
 * Extrait les listes TMD / Criticité d'une réponse /api/catalogs,
 * au format { tmd: [...], criticite: {...} } ou alias minuscules.
 */
export function extractTmdFromCatalogs(body: unknown): TmdEntry[] {
  if (!body || typeof body !== "object") return [];
  const obj = body as Record<string, unknown>;
  const candidate = obj.tmd ?? obj.Tmd ?? obj.TMD;
  if (Array.isArray(candidate)) return toTmdArray(candidate);
  return toTmdArray(candidate ?? []);
}

export function extractCriticiteFromCatalogs(body: unknown): CriticiteData {
  if (!body || typeof body !== "object") {
    return { Courant: [], Critique: [], Majeur: [] };
  }
  const obj = body as Record<string, unknown>;
  const candidate = obj.criticite ?? obj.Criticite ?? obj.criteres ?? obj.data;
  return normalizeCriticiteData(candidate);
}

async function fetchTmdFromCatalogs(): Promise<TmdEntry[]> {
  try {
    const body = await request<unknown>("/api/catalogs");
    return extractTmdFromCatalogs(body);
  } catch {
    return [];
  }
}

async function fetchCriticiteFromCatalogs(): Promise<CriticiteData> {
  try {
    const body = await request<unknown>("/api/catalogs");
    return extractCriticiteFromCatalogs(body);
  } catch {
    return { Courant: [], Critique: [], Majeur: [] };
  }
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
    return request<unknown>("/api/tmd").then((body) =>
      normalizeTmdList(body).then((entries) => {
        if (entries.length > 0) return entries;
        return fetchTmdFromCatalogs().then((fromCatalogs) => {
          if (fromCatalogs.length > 0) return fromCatalogs;
          return fetchLocalTmdFallback();
        });
      }),
    );
  },

  tmdSearch(q: string): Promise<TmdEntry[]> {
    return request<unknown>("/api/tmd/search?q=" + encodeURIComponent(q)).then(
      (body) =>
        normalizeTmdList(body).then((entries) => {
          if (entries.length > 0) return entries;
          return fetchTmdFromCatalogs().then((fromCatalogs) => {
            if (fromCatalogs.length > 0) return filterTmdByQuery(fromCatalogs, q);
            return fetchLocalTmdFallback().then((fallback) =>
              filterTmdByQuery(fallback, q),
            );
          });
        }),
    );
  },

  criticite(): Promise<CriticiteData> {
    return request<unknown>("/api/criticite").then((body) => {
      const normalized = normalizeCriticiteData(body);
      if (!isEmptyCriticite(normalized)) return normalized;
      return fetchCriticiteFromCatalogs().then((fromCatalogs) => {
        if (!isEmptyCriticite(fromCatalogs)) return fromCatalogs;
        return fetchLocalCriticiteFallback().then((fallback) =>
          isEmptyCriticite(fallback) ? normalized : fallback,
        );
      });
    });
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