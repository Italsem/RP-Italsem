im// functions/api/admin/users.ts
import { badRequest, hashPassword, json, requireAdmin } from "../_auth";

function randomSalt(): string {
  // semplice + robusto
  return crypto.randomUUID().replaceAll("-", "");
}

export async function onRequestGet({ request, env }: any) {
  try {
    await requireAdmin(env, request);

    const res = await env.DB.prepare(
      `SELECT id, username, role, is_active, created_at, first_name, last_name
       FROM users
       ORDER BY id DESC`
    ).all();

    return json({ ok: true, users: res.results || [] });
  } catch (e: any) {
    const msg = e?.message || String(e);
    const status = msg === "FORBIDDEN" ? 403 : msg === "UNAUTHORIZED" ? 401 : 500;
    return json({ ok: false, message: msg }, { status });
  }
}

export async function onRequestPost({ request, env }: any) {
  try {
    await requireAdmin(env, request);

    const body = await request.json().catch(() => ({}));
    const first_name = String(body.first_name || "").trim();
    const last_name = String(body.last_name || "").trim();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const role = (String(body.role || "USER").toUpperCase() === "ADMIN" ? "ADMIN" : "USER") as
      | "ADMIN"
      | "USER";

    if (!username || !password) return badRequest("Username e password obbligatori");
    if (username.length < 3) return badRequest("Username troppo corto (min 3)");
    if (password.length < 6) return badRequest("Password troppo corta (min 6)");

    const existing = await env.DB.prepare(`SELECT id FROM users WHERE username = ?`).bind(username).first();
    if (existing?.id) return badRequest("Username già esistente");

    const salt = randomSalt();
    const password_hash = await hashPassword(password, salt);

    await env.DB.prepare(
      `INSERT INTO users (username, password_hash, salt, role, is_active, first_name, last_name)
       VALUES (?, ?, ?, ?, 1, ?, ?)`
    )
      .bind(username, password_hash, salt, role, first_name || null, last_name || null)
      .run();

    return json({ ok: true });
  } catch (e: any) {
    const msg = e?.message || String(e);
    const status = msg === "FORBIDDEN" ? 403 : msg === "UNAUTHORIZED" ? 401 : 500;
    return json({ ok: false, message: msg }, { status });
  }
}
