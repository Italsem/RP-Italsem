export type AuthedUser = {
  id: number;
  username: string;
  role: "ADMIN" | "USER";
  first_name?: string | null;
  last_name?: string | null;
};

function parseCookies(cookieHeader: string | null) {
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

function makeSessionId() {
  return crypto.randomUUID();
}

export async function getUser(ctx: any): Promise<AuthedUser | null> {
  const cookies = parseCookies(ctx.request.headers.get("Cookie"));
  const sid = cookies["sid"];
  if (!sid) return null;

  const session = await ctx.env.DB.prepare(
    `SELECT s.id as sid, s.user_id, u.id, u.username, u.role, u.is_active, u.first_name, u.last_name
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`
  )
    .bind(sid)
    .first<any>();

  if (!session || !session.is_active) return null;

  return {
    id: session.id,
    username: session.username,
    role: session.role,
    first_name: session.first_name,
    last_name: session.last_name,
  };
}

export function requireAdmin(u: AuthedUser | null) {
  return !!u && u.role === "ADMIN";
}

/**
 * Crea una sessione e setta cookie "sid"
 * - SameSite=None + Secure per funzionare su Pages in HTTPS
 */
export async function createSession(ctx: any, u: AuthedUser) {
  const sid = makeSessionId();

  await ctx.env.DB.prepare(
    `INSERT INTO sessions (id, user_id, created_at)
     VALUES (?, ?, datetime('now'))`
  )
    .bind(sid, u.id)
    .run();

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `sid=${encodeURIComponent(sid)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 14}`
  );

  return new Response(
    JSON.stringify({
      ok: true,
      user: u,
    }),
    {
      status: 200,
      headers: {
        ...Object.fromEntries(headers.entries()),
        "Content-Type": "application/json",
      },
    }
  );
}

export function clearSessionCookie() {
  return `sid=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
}
