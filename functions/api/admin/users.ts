// functions/api/admin/users.ts
import { json, badRequest, requireAdmin, sha256Hex } from "../_auth";

function randSalt() {
  return crypto.randomUUID().replaceAll("-", "");
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const g = await requireAdmin(ctx);
  if (!g.ok) return g.res;

  const rows = await ctx.env.DB.prepare(
    `SELECT id, username, role, is_active, first_name, last_name, created_at
     FROM users ORDER BY id DESC`
  ).all<any>();

  return json({ ok: true, users: rows.results || [] });
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const g = await requireAdmin(ctx);
  if (!g.ok) return g.res;

  const b = await ctx.request.json().catch(() => null) as any;
  const username = (b?.username || "").trim();
  const password = (b?.password || "").toString();
  const role = (b?.role || "USER") as "USER" | "ADMIN";
  const first_name = (b?.first_name || "").trim();
  const last_name = (b?.last_name || "").trim();

  if (!username || !password) return badRequest("Missing username/password");
  if (role !== "USER" && role !== "ADMIN") return badRequest("Invalid role");

  const exists = await ctx.env.DB.prepare(`SELECT 1 FROM users WHERE username=?`).bind(username).first<any>();
  if (exists) return badRequest("Username già esistente");

  const salt = randSalt();
  const password_hash = await sha256Hex(salt + password);

  await ctx.env.DB.prepare(
    `INSERT INTO users (username, password_hash, salt, role, is_active, first_name, last_name)
     VALUES (?, ?, ?, ?, 1, ?, ?)`
  ).bind(username, password_hash, salt, role, first_name, last_name).run();

  return json({ ok: true });
};
