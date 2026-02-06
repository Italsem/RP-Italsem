import { getUser, requireAdmin } from "../_auth";

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return new Response("Forbidden", { status: 403 });

  const r = await ctx.env.DB.prepare(
    `SELECT id, username, role, is_active, first_name, last_name
     FROM users
     ORDER BY id`
  ).all();

  return Response.json(r.results ?? []);
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return new Response("Forbidden", { status: 403 });

  const { first_name, last_name, username, password, role } = await ctx.request.json();

  if (!first_name || !last_name || !username || !password) {
    return new Response("Missing fields", { status: 400 });
  }

  const userRole = role === "ADMIN" ? "ADMIN" : "USER";

  // ✅ Password salvata in chiaro (temporaneo, per velocità)
  await ctx.env.DB.prepare(
    `INSERT INTO users (username, password_hash, role, is_active, first_name, last_name)
     VALUES (?, ?, ?, 1, ?, ?)`
  )
    .bind(String(username), String(password), userRole, String(first_name), String(last_name))
    .run();

  return Response.json({ ok: true });
};

