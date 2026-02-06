// functions/api/auth/logout.ts
import { json, clearSessionCookie } from "../_auth";

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  // opzionale: cancella session server-side se vuoi (non indispensabile)
  const res = json({ ok: true });
  const headers = new Headers(res.headers);
  headers.append("set-cookie", clearSessionCookie());
  return new Response(res.body, { status: res.status, headers });
};
