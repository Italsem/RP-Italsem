// functions/api/auth/login.ts
import { json, badRequest, unauthorized, setSessionCookie, createSession, sha256Hex } from "../_auth";

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const body = await ctx.request.json().catch(() => null) as any;
  const username = (body?.username || "").trim();
  const password = (body?.password || "").toString();

  if (!username || !password) return badRequest("Missing username/password");

  const u = await ctx.env.DB.prepare(
    `SELECT id, username, password_hash, salt, role, is_active, first_name, last_name
     FROM users WHERE username=? LIMIT 1`
  ).bind(username).first<any>();

  if (!u || !u.is_active) return unauthorized("Credenziali non valide");

  const salt = (u.salt || "").toString();
  const computed = await sha256Hex(salt + password);

  if (computed !== u.password_hash) return unauthorized("Credenziali non valide");

  const sid = await createSession(ctx, u.id);
  return json(
    { ok: true, user: { id: u.id, username: u.username, role: u.role, firstName: u.first_name ?? "", lastName: u.last_name ?? "" } },
    { headers: { "Set-Cookie": setSessionCookie(sid) } }
  );
};
