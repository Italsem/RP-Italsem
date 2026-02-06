import { sha256Hex, createSession, json } from "../_auth";

export const onRequestPost = async (ctx: any) => {
  const { username, password } = await ctx.request.json();

  const user = await ctx.env.DB.prepare(
    "SELECT * FROM users WHERE username=? AND is_active=1"
  ).bind(username).first();

  if (!user) return json({ error: "Credenziali non valide" }, { status: 401 });

  const hash = await sha256Hex(password + user.salt);
  if (hash !== user.password_hash) {
    return json({ error: "Credenziali non valide" }, { status: 401 });
  }

  return createSession(ctx, user.id);
};
