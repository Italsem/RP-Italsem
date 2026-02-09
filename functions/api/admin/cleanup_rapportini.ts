import { requireAdmin, json } from "../_auth";

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const a = await requireAdmin(ctx);
  if (!a.ok) return a.res;

  const before = await ctx.env.DB.prepare("SELECT COUNT(*) AS c FROM rapportini").first<{ c: number }>();
  await ctx.env.DB.prepare("DELETE FROM rapportini").run();
  const after = await ctx.env.DB.prepare("SELECT COUNT(*) AS c FROM rapportini").first<{ c: number }>();

  return json({
    ok: true,
    deleted: Math.max(0, Number(before?.c || 0) - Number(after?.c || 0)),
    remaining: Number(after?.c || 0),
  });
};
