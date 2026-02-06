// functions/api/_auth.ts
type Env = { DB: D1Database };

const COOKIE_NAME = "rp_session";

export function json(data: any, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data, null, 2), { ...init, headers });
}

export function unauthorized(message = "Unauthorized") {
  return json({ ok: false, error: message }, { status: 401 });
}

export function clearSessionCookie() {
  // scade subito
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function setSessionCookie(sessionId: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  return `${COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function parseCookies(header: string | null) {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(v.join("=") || "");
  }
  return out;
}

export async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isHex64(s: string) {
  return /^[a-f0-9]{64}$/i.test(s);
}

function randomSalt() {
  // semplice, ok per questo uso (non PII)
  const a = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(a).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(storedHash: string, salt: string, password: string) {
  // 1) legacy: se in DB è in chiaro, accetta
  if (!isHex64(storedHash)) {
    return storedHash === password;
  }

  // 2) supporta entrambi gli ordini per compatibilità con versioni vecchie
  const h1 = await sha256Hex(salt + password);
  if (h1.toLowerCase() === storedHash.toLowerCase()) return true;

  const h2 = await sha256Hex(password + salt);
  if (h2.toLowerCase() === storedHash.toLowerCase()) return true;

  return false;
}

export async function rehashToCurrent(env: Env, userId: number, password: string) {
  const salt = randomSalt();
  const password_hash = await sha256Hex(salt + password); // “standard” attuale: salt + password
  await env.DB.prepare("UPDATE users SET salt=?, password_hash=? WHERE id=?")
    .bind(salt, password_hash, userId)
    .run();
}

export async function createSession(env: Env, userId: number) {
  const sessionId = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, datetime('now', '+7 days'), datetime('now'))"
  )
    .bind(sessionId, userId)
    .run();
  return sessionId;
}

export async function getUser(ctx: { request: Request; env: Env }) {
  const cookies = parseCookies(ctx.request.headers.get("cookie"));
  const sid = cookies[COOKIE_NAME];
  if (!sid) return null;

  const row = await ctx.env.DB.prepare(
    `SELECT u.id, u.username, u.role, u.is_active, u.first_name, u.last_name
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > datetime('now') AND u.is_active = 1`
  )
    .bind(sid)
    .first<any>();

  return row || null;
}

export async function requireAdmin(ctx: { request: Request; env: Env }) {
  const u = await getUser(ctx);
  if (!u) return null;
  if (u.role !== "ADMIN") return null;
  return u;
}

export function withSetCookie(res: Response, cookie: string) {
  const headers = new Headers(res.headers);
  headers.append("set-cookie", cookie);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export function sessionCookieHeader(sessionId: string) {
  return setSessionCookie(sessionId);
}
