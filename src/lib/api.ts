// src/lib/api.ts
export type ApiErrorPayload = {
  ok?: false;
  error?: string;
  message?: string;
};

async function parseError(r: Response): Promise<string> {
  const ct = r.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const j = (await r.json()) as ApiErrorPayload | any;
      return j?.message || j?.error || JSON.stringify(j);
    }
    const t = await r.text();
    return t || `HTTP ${r.status}`;
  } catch {
    return `HTTP ${r.status}`;
  }
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const r = await fetch(path, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!r.ok) throw new Error(await parseError(r));
  // se non è json, ritorna testo
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return (await r.text()) as unknown as T;
  return (await r.json()) as T;
}

export async function apiPost<T = any, B = any>(path: string, body?: B): Promise<T> {
  const r = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await parseError(r));
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return (await r.text()) as unknown as T;
  return (await r.json()) as T;
}
