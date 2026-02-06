// functions/api/admin/users.ts
import { json, requireAdmin, sha256Hex } from "../_auth";

function randomSalt() {
  const a = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(a).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const admin = await requireAdmin(ctx as any);
  if (!admin) return json({ ok: false, error: "Forbidden" }, { status: 403 });

  const rows = await ctx.env.DB.prepare(
    "SELECT id, username, role, is_active, first_name, last_name, created_at FROM users ORDER BY id DESC"
  ).all();

  return json({ ok: true, rows: rows.results || [] });
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const admin = await requireAdmin(ctx as any);
  if (!admin) return json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await ctx.request.json().catch(() => null);

  const username = String(body?.username || "").trim();
  const password = String(body?.password || "");
  const first_name = String(body?.first_name || "").trim();
  const last_name = String(body?.last_name || "").trim();
  const role = String(body?.role || "USER").toUpperCase() === "ADMIN" ? "ADMIN" : "USER";

  if (!username || !password) return json({ ok: false, error: "Missing fields" }, { status: 400 });

  const salt = randomSalt();
  const password_hash = await sha256Hex(salt + password);

  await ctx.env.DB.prepare(
    `INSERT INTO users (username, password_hash, salt, role, is_active, first_name, last_name)
     VALUES (?, ?, ?, ?, 1, ?, ?)`
  )
    .bind(username, password_hash, salt, role, first_name || null, last_name || null)
    .run();

  return json({ ok: true });
};
