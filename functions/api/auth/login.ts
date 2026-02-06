// functions/api/auth/login.ts
import { json, createSession, sessionCookieHeader, withSetCookie, verifyPassword, rehashToCurrent } from "../_auth";

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const body = await ctx.request.json().catch(() => null);
  const username = String(body?.username || "").trim();
  const password = String(body?.password || "");

  if (!username || !password) return json({ ok: false, error: "Missing credentials" }, { status: 400 });

  const user = await ctx.env.DB.prepare(
    "SELECT id, username, password_hash, salt, role, is_active, first_name, last_name FROM users WHERE username=?"
  )
    .bind(username)
    .first<any>();

  if (!user || user.is_active !== 1) return json({ ok: false, error: "Credenziali non valide" }, { status: 401 });

  const ok = await verifyPassword(user.password_hash, user.salt, password);
  if (!ok) return json({ ok: false, error: "Credenziali non valide" }, { status: 401 });

  // Se era legacy (password in chiaro) -> rehash automatico e fine problemi
  // (verifyPassword torna true anche per legacy)
  if (!/^[a-f0-9]{64}$/i.test(String(user.password_hash || ""))) {
    await rehashToCurrent(ctx.env as any, user.id, password);
  }

  const sid = await createSession(ctx.env as any, user.id);
  const res = json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    },
  });

  return withSetCookie(res, sessionCookieHeader(sid));
};
