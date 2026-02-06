import type { PagesFunction } from "@cloudflare/workers-types";

export async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function json(data: any, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

export async function getUser(ctx: any) {
  const cookie = ctx.request.headers.get("Cookie") || "";
  const match = cookie.match(/session=([a-zA-Z0-9_-]+)/);
  if (!match) return null;

  const sid = match[1];
  const row = await ctx.env.DB.prepare(`
    SELECT u.*
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(sid).first();

  return row || null;
}

export async function requireAdmin(ctx: any) {
  const u = await getUser(ctx);
  if (!u || u.role !== "ADMIN") {
    return { ok: false, res: new Response("Unauthorized", { status: 401 }) };
  }
  return { ok: true, user: u };
}

export function clearSessionCookie() {
  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": "session=; Path=/; Max-Age=0; HttpOnly",
      Location: "/",
    },
  });
}

export async function createSession(ctx: any, userId: number) {
  const sid = crypto.randomUUID().replace(/-/g, "");
  await ctx.env.DB.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, datetime('now', '+7 days'))
  `).bind(sid, userId).run();

  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": `session=${sid}; Path=/; HttpOnly`,
      Location: "/dashboard",
    },
  });
}
