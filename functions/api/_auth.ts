function parseCookies(cookieHeader: string | null) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;

  cookieHeader.split(";").forEach((part) => {
    const [k, ...v] = part.trim().split("=");
    out[k] = decodeURIComponent(v.join("="));
  });
  return out;
}

export async function getUser(ctx: { request: Request; env: { DB: D1Database } }) {
  const cookies = parseCookies(ctx.request.headers.get("Cookie"));
  const sid = cookies["sid"];
  if (!sid) return null;

  const u = await ctx.env.DB.prepare(
    `SELECT u.id, u.username, u.role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?
       AND u.is_active = 1
       AND s.expires_at > datetime('now')`
  ).bind(sid).first();

  return u ?? null;
}

// Cookie compatibile (su Pages sei in HTTPS quindi Secure va bene)
export function setSessionCookie(_req: Request, sid: string, maxAgeSeconds: number) {
  return `sid=${encodeURIComponent(sid)}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie(_req: Request) {
  return `sid=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`;
}
