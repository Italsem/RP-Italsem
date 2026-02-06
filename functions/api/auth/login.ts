import { setSessionCookie } from "../_auth";

function b64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b64bytes(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

async function pbkdf2Hash(password: string, saltB64: string) {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 120000 },
    key,
    256
  );
  return b64(bits);
}

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const { username, password } = await ctx.request.json();

  if (!username || !password) return new Response("Missing credentials", { status: 400 });

  const u = await ctx.env.DB.prepare(
    "SELECT id, username, password_hash, salt, role, is_active FROM users WHERE username = ?"
  ).bind(username).first<any>();

  if (!u || u.is_active !== 1) return new Response("Unauthorized", { status: 401 });

  const hash = await pbkdf2Hash(password, u.salt);
  if (hash !== u.password_hash) return new Response("Unauthorized", { status: 401 });

  const sid = crypto.randomUUID();
  const maxAge = 60 * 60 * 12; // 12 ore

  await ctx.env.DB.prepare(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', ?))"
  ).bind(sid, u.id, `+${maxAge} seconds`).run();

  return new Response(
    JSON.stringify({ ok: true, user: { id: u.id, username: u.username, role: u.role } }),
    {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": setSessionCookie(sid, maxAge),
      },
    }
  );
};
