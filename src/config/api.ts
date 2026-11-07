const DEFAULT_API_URL = "https://backend-d4f1.onrender.com";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(
  /\/+$/,
  "",
);

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
