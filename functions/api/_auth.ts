// functions/api/_auth.ts
export type Role = "ADMIN" | "USER";

export type SessionUser = {
  id: number;
  username: string;
  role: Role;
  first_name?: string | null;
  last_name?: string | null;
};

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(";");
  for (const p of parts) {
    const [k, ...rest] = p.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join("=") || "");
  }
  return out;
}

export function getSessionIdFromRequest(request: Request): string | null {
  const cookies = parseCookies(request.headers.get("Cookie"));
  return cookies["sid"] || null;
}

export function makeSessionCookie(sid: string): string {
  // Pages = https -> Secure OK
  // SameSite=None serve per far funzionare cookie in fetch cross-page
  return `sid=${encodeURIComponent(sid)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 7}`;
}

export function clearSessionCookie(): string {
  return `sid=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
}

function isHex64(s: string): boolean {
  return /^[0-9a-f]{64}$/i.test(s);
}

export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  // schema: sha256(password + ":" + salt)
  return sha256Hex(`${password}:${salt}`);
}

export async function verifyPassword(
  providedPassword: string,
  dbRow: { password_hash: string; salt: string }
): Promise<boolean> {
  const stored = (dbRow.password_hash || "").trim();

  // ✅ Fallback “anti-drama”:
  // Se nel DB c’è testo in chiaro (tipo "Italsems26") facciamo compare diretto.
  // Così non rimani bloccato se in passato abbiamo salvato male l’hash.
  if (!isHex64(stored)) {
    return stored === providedPassword;
  }

  const computed = await hashPassword(providedPassword, dbRow.salt);
  return computed === stored;
}

export function json(data: any, init?: ResponseInit) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init?.headers || {}),
    },
  });
}

export function badRequest(message: string, extra?: any) {
  return json({ ok: false, error: "BAD_REQUEST", message, ...extra }, { status: 400 });
}

export function unauthorized(message = "Non autorizzato") {
  return json({ ok: false, error: "UNAUTHORIZED", message }, { status: 401 });
}

export function forbidden(message = "Accesso negato") {
  return json({ ok: false, error: "FORBIDDEN", message }, { status: 403 });
}

export async function getUser(env: any, request: Request): Promise<SessionUser | null> {
  const sid = getSessionIdFromRequest(request);
  if (!sid) return null;

  const sess = await env.DB.prepare(
    `SELECT s.user_id as user_id
     FROM sessions s
     WHERE s.id = ? AND s.expires_at > datetime('now')`
  )
    .bind(sid)
    .first();

  if (!sess?.user_id) return null;

  const u = await env.DB.prepare(
    `SELECT id, username, role, first_name, last_name
     FROM users
     WHERE id = ? AND is_active = 1`
  )
    .bind(sess.user_id)
    .first();

  if (!u?.id) return null;

  return {
    id: Number(u.id),
    username: String(u.username),
    role: (u.role as Role) || "USER",
    first_name: u.first_name ?? null,
    last_name: u.last_name ?? null,
  };
}

export async function requireUser(env: any, request: Request): Promise<SessionUser> {
  const u = await getUser(env, request);
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export async function requireAdmin(env: any, request: Request): Promise<SessionUser> {
  const u = await requireUser(env, request);
  if (u.role !== "ADMIN") throw new Error("FORBIDDEN");
  return u;
}

export async function createSession(env: any, userId: number): Promise<{ sid: string; cookie: string }> {
  const sid = crypto.randomUUID();

  // ✅ FIX: expires_at SEMPRE valorizzato (NOT NULL)
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, expires_at)
     VALUES (?, ?, datetime('now', '+7 days'))`
  )
    .bind(sid, userId)
    .run();

  return { sid, cookie: makeSessionCookie(sid) };
}

export async function destroySession(env: any, request: Request): Promise<void> {
  const sid = getSessionIdFromRequest(request);
  if (!sid) return;
  await env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(sid).run();
}
