// functions/api/auth/login.ts
import { badRequest, createSession, json, verifyPassword } from "../_auth";

export async function onRequestPost({ request, env }: any) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) return badRequest("Username e password obbligatori");

    const row = await env.DB.prepare(
      `SELECT id, username, password_hash, salt, role, is_active, first_name, last_name
       FROM users
       WHERE username = ?`
    )
      .bind(username)
      .first();

    if (!row?.id) return json({ ok: false, message: "Credenziali non valide" }, { status: 401 });
    if (Number(row.is_active) !== 1) return json({ ok: false, message: "Utente disattivato" }, { status: 401 });

    const ok = await verifyPassword(password, { password_hash: row.password_hash, salt: row.salt });
    if (!ok) return json({ ok: false, message: "Credenziali non valide" }, { status: 401 });

    const { cookie } = await createSession(env, Number(row.id));

    return json(
      {
        ok: true,
        user: {
          id: Number(row.id),
          username: String(row.username),
          role: String(row.role),
          first_name: row.first_name ?? null,
          last_name: row.last_name ?? null,
        },
      },
      {
        status: 200,
        headers: { "Set-Cookie": cookie },
      }
    );
  } catch (e: any) {
    return json(
      { ok: false, error: "LOGIN_EXCEPTION", message: e?.message || String(e) },
      { status: 500 }
    );
  }
}
