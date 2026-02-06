import { setSessionCookie } from "../_auth";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const { username, password } = await ctx.request.json();
  if (!username || !password) return new Response("Missing credentials", { status: 400 });

  const u = await ctx.env.DB.prepare(
    "SELECT id, username, password_hash, salt, role, is_active, first_name, last_name FROM users WHERE username = ?"
  ).bind(username).first<any>();

  if (!u || u.is_active !== 1) return new Response("Unauthorized", { status: 401 });

  const computed = await sha256Hex(`${u.salt}:${password}`);
  if (computed !== u.password_hash) return new Response("Unauthorized", { status: 401 });

  const sid = crypto.randomUUID();
  const maxAge = 60 * 60 * 12; // 12 ore

  await ctx.env.DB.prepare(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', ?))"
  ).bind(sid, u.id, `+${maxAge} seconds`).run();

  return new Response(
    JSON.stringify({
      ok: true,
      user: {
        id: u.id,
        username: u.username,
        role: u.role,
        firstName: u.first_name ?? "",
        lastName: u.last_name ?? "",
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": setSessionCookie(ctx.request, sid, maxAge),
      },
    }
  );
};
