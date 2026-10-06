const engineUrl = process.env.SHUNO_ENGINE_URL?.replace(/\/$/, "");
const apiKey = process.env.SHUNO_ENGINE_API_KEY;

export function getEngineUrl() {
  if (!engineUrl) throw new Error("SHUNO_ENGINE_URL no está configurada.");
  return engineUrl;
}

export function engineHeaders(extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...extra };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

export async function engineFetch(path: string, init?: RequestInit) {
  const url = `${getEngineUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = engineHeaders(Object.fromEntries(new Headers(init?.headers ?? {}).entries()));
  return fetch(url, { ...init, headers, cache: "no-store" });
}
