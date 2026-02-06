import { getUser, requireAdmin } from "../_auth";

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return new Response("Forbidden", { status: 403 });

  const r = await ctx.env.DB.prepare(
    `SELECT id, username, role, is_active, first_name, last_name, created_at
     FROM users
     ORDER BY id`
  ).all();

  return Response.json(r.results ?? []);
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return new Response("Forbidden", { status: 403 });

  const { first_name, last_name, username, password, role } = await ctx.request.json();

  if (!username || !password) return new Response("Missing fields", { status: 400 });

  const salt = crypto.randomUUID();
  const password_hash = await sha256Hex(String(password) + salt); // ✅ formato: password + salt
  const userRole = role === "ADMIN" ? "ADMIN" : "USER";

  await ctx.env.DB.prepare(
    `INSERT INTO users (username, password_hash, salt, role, is_active, first_name, last_name)
     VALUES (?, ?, ?, ?, 1, ?, ?)`
  )
    .bind(
      String(username).trim(),
      password_hash,
      salt,
      userRole,
      first_name ?? null,
      last_name ?? null
    )
    .run();

  return Response.json({ ok: true });
};
