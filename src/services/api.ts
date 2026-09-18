import type {
  Catalogs,
  HealthResponse,
  Highway,
  HistoryEvent,
  CriticiteData,
  TmdEntry,
  DirectoryEntry,
} from "@/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error || `Erreur serveur (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
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