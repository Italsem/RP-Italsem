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
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join("=") || "");
  }
  return out;
}

export function clearSessionCookie() {
  return `sid=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
}

function newSid() {
  return crypto.randomUUID();
}

// ✅ crea sessione anche se la tabella ha solo (id, user_id)
export async function createSession(ctx: any, u: AuthedUser) {
  const sid = newSid();

  try {
    await ctx.env.DB.prepare(
      `INSERT INTO sessions (id, user_id, created_at) VALUES (?, ?, datetime('now'))`
    ).bind(sid, u.id).run();
  } catch (_e) {
    await ctx.env.DB.prepare(
      `INSERT INTO sessions (id, user_id) VALUES (?, ?)`
    ).bind(sid, u.id).run();
  }

  return new Response(JSON.stringify({ ok: true, user: u }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `sid=${encodeURIComponent(sid)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 14}`,
    },
  });
}

export async function getUser(ctx: any): Promise<AuthedUser | null> {
  const cookies = parseCookies(ctx.request.headers.get("Cookie"));
  const sid = cookies["sid"];
  if (!sid) return null;

  const row = await ctx.env.DB.prepare(
    `SELECT u.id, u.username, u.role, u.is_active, u.first_name, u.last_name
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`
  ).bind(sid).first<any>();

  if (!row || !row.is_active) return null;

  return {
    id: row.id,
    username: row.username,
    role: row.role,
    first_name: row.first_name,
    last_name: row.last_name,
  };
}

export function requireAdmin(u: AuthedUser | null) {
  return !!u && u.role === "ADMIN";
}
