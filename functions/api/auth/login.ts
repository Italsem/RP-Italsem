import { createSession } from "../_auth";

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const { username, password } = await ctx.request.json();

  if (!username || !password) {
    return new Response("Missing credentials", { status: 400 });
  }

  const user = await ctx.env.DB.prepare(
    "SELECT id, username, password_hash, role, is_active, first_name, last_name FROM users WHERE username = ?"
  ).bind(username).first<any>();

  if (!user || !user.is_active) {
    return new Response("Invalid credentials", { status: 401 });
  }

  // 🔥 CONFRONTO DIRETTO (STOP HASH)
  if (String(user.password_hash) !== String(password)) {
    return new Response("Invalid credentials", { status: 401 });
  }

  return await createSession(ctx, {
    id: user.id,
    username: user.username,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name,
  });
};
