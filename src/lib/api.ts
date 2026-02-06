export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(path, {
    method: "GET",
    credentials: "include"
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as T;
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) throw new Error(await r.text());
  const txt = await r.text();
  return (txt ? JSON.parse(txt) : ({} as any)) as T;
}
