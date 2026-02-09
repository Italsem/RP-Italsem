// functions/api/day/add_cantiere.ts
import { json, badRequest, requireAuth } from "../_auth";

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const a = await requireAuth(ctx);
  if (!a.ok) return a.res;

  const b = await ctx.request.json().catch(() => null) as any;
  const work_date = (b?.work_date || "").trim(); // YYYY-MM-DD
  const cantiere_code = (b?.cantiere_code || "").trim();
  const cantiere_desc = (b?.cantiere_desc || "").trim();

  if (!work_date || !cantiere_code || !cantiere_desc) return badRequest("Missing fields");

  const emptyPayload = {
    rows: [],
    days: [work_date],
  };

  await ctx.env.DB.prepare(
    `INSERT INTO day_sheets (work_date, cantiere_code, cantiere_desc, payload, created_by, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(work_date, cantiere_code) DO UPDATE SET
       cantiere_desc=excluded.cantiere_desc,
       updated_at=datetime('now')`
  ).bind(work_date, cantiere_code, cantiere_desc, JSON.stringify(emptyPayload), a.user.id).run();

  return json({ ok: true });
};
