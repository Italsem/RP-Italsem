// functions/api/_auth.ts
export type Role = "ADMIN" | "USER";

const COOKIE_NAME = "sid";
const SESSION_DAYS = 7;

function cookieAttrs() {
  // In produzione su HTTPS: Secure è obbligatorio se SameSite=None
  return `HttpOnly; Secure; SameSite=None; Path=/`;
}

export function json(data: any, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) },
    status: init.status || 200,
  });
}

export function unauthorized(msg = "Unauthorized") {
  return json({ ok: false, error: msg }, { status: 401 });
}

export function forbidden(msg = "Forbidden") {
  return json({ ok: false, error: msg }, { status: 403 });
}

export function badRequest(msg = "Bad request") {
  return json({ ok: false, error: msg }, { status: 400 });
}

export function clearSessionCookie() {
  // Expire immediato
  return `${COOKIE_NAME}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${cookieAttrs()}`;
}

export function setSessionCookie(sid: string) {
  // Max-Age coerente con expires_at (7 giorni)
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${COOKIE_NAME}=${sid}; Max-Age=${maxAge}; ${cookieAttrs()}`;
}

export function parseCookies(cookieHeader: string | null) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const k = p.slice(0, idx).trim();
    const v = p.slice(idx + 1).trim();
    out[k] = v;
  }
  return out;
}

export async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const arr = Array.from(new Uint8Array(digest));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSession(ctx: any, userId: number) {
  const sid = crypto.randomUUID();
  await ctx.env.DB.prepare(
    `INSERT INTO sessions (id, user_id, expires_at)
     VALUES (?, ?, datetime('now', '+${SESSION_DAYS} days'))`
  ).bind(sid, userId).run();
  return sid;
}

export async function deleteSession(ctx: any, sid: string) {
  await ctx.env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(sid).run();
}

export async function getUser(ctx: any) {
  const cookies = parseCookies(ctx.request.headers.get("Cookie"));
  const sid = cookies[COOKIE_NAME];
  if (!sid) return null;

  const row = await ctx.env.DB.prepare(
    `SELECT u.id, u.username, u.role, u.is_active
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > datetime('now')
     LIMIT 1`
  ).bind(sid).first<any>();

  if (!row) return null;
  if (!row.is_active) return null;
  return row as { id: number; username: string; role: Role; is_active: number };
}

export async function requireAuth(ctx: any) {
  const u = await getUser(ctx);
  if (!u) return { ok: false as const, res: unauthorized() };
  return { ok: true as const, user: u };
}

export async function requireAdmin(ctx: any) {
  const a = await requireAuth(ctx);
  if (!a.ok) return a;
  if (a.user.role !== "ADMIN") return { ok: false as const, res: forbidden() };
  return a;
}
