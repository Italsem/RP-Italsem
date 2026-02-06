function parseCookies(cookieHeader: string | null) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;

  cookieHeader.split(";").forEach((part) => {
    const [k, ...v] = part.trim().split("=");
    out[k] = decodeURIComponent(v.join("="));
  });
  return out;
}

export type AuthedUser = {
  id: number;
  username: string;
  role: "ADMIN" | "USER";
  first_name: string | null;
  last_name: string | null;
};

export async function getUser(ctx: { request: Request; env: { DB: D1Database } }): Promise<AuthedUser | null> {
  const cookies = parseCookies(ctx.request.headers.get("Cookie"));
  const sid = cookies["sid"];
  if (!sid) return null;

  const u = await ctx.env.DB.prepare(
    `SELECT u.id, u.username, u.role, u.first_name, u.last_name
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?
       AND u.is_active = 1
       AND s.expires_at > datetime('now')`
  ).bind(sid).first<AuthedUser>();

  return u ?? null;
}

export function requireAdmin(user: AuthedUser | null) {
  return !!user && user.role === "ADMIN";
}

export function setSessionCookie(_req: Request, sid: string, maxAgeSeconds: number) {
  // robusto su Cloudflare Pages
  return `sid=${encodeURIComponent(sid)}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie(_req: Request) {
  return `sid=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`;
}
