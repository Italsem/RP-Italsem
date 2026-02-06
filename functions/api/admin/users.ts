import { requireAdmin, sha256Hex, json } from "../_auth";

export const onRequestPost = async (ctx: any) => {
  const g = await requireAdmin(ctx);
  if (!g.ok) return g.res;

  const { username, password, role } = await ctx.request.json();

  const salt = crypto.randomUUID().slice(0, 8);
  const hash = await sha256Hex(password + salt);

  await ctx.env.DB.prepare(`
    INSERT INTO users (username, password_hash, salt, role, is_active)
    VALUES (?, ?, ?, ?, 1)
  `).bind(username, hash, salt, role || "USER").run();

  return json({ ok: true });
};
