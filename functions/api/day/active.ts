import { getUser } from "../_auth";

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });

  const date = new URL(ctx.request.url).searchParams.get("date");
  if (!date) return new Response("Missing date", { status: 400 });

  const r = await ctx.env.DB.prepare(
    `SELECT work_date, cantiere_code, cantiere_desc, payload, updated_at
     FROM day_sheets
     WHERE work_date=?
     ORDER BY cantiere_desc`
  ).bind(date).all<any>();

  const out = (r.results || []).map((x: any) => {
    let internal_desc = "";
    try {
      const p = JSON.parse(x.payload || "{}");
      internal_desc = String(p.internal_desc || "").trim();
    } catch {}
    return {
      work_date: x.work_date,
      cantiere_code: x.cantiere_code,
      cantiere_desc: x.cantiere_desc,
      internal_desc,
      updated_at: x.updated_at,
    };
  });

  return Response.json(out);
};
