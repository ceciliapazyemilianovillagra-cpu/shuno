const SUNO_BASE_URL = "https://api.sunoapi.org";

export function getSunoApiKey() {
  const key = process.env.SUNO_API_KEY;
  if (!key) throw new Error("SUNO_API_KEY no está configurada en Vercel.");
  return key;
}

export async function sunoFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Authorization", `Bearer ${getSunoApiKey()}`);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  return fetch(`${SUNO_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
