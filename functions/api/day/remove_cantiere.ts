import { json, badRequest, requireAuth } from "../_auth";

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const a = await requireAuth(ctx);
  if (!a.ok) return a.res;

  const b = await ctx.request.json().catch(() => null) as any;
  const work_date = String(b?.work_date || "").trim();
  const cantiere_code = String(b?.cantiere_code || "").trim();
  if (!work_date || !cantiere_code) return badRequest("Missing work_date/cantiere_code");

  await ctx.env.DB.prepare(
    `DELETE FROM day_sheets WHERE work_date=? AND cantiere_code=?`
  ).bind(work_date, cantiere_code).run();

  return json({ ok: true });
};
