import { getUser } from "../_auth";

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });

  const date = new URL(ctx.request.url).searchParams.get("date");
  if (!date) return new Response("Missing date", { status: 400 });

  const r = await ctx.env.DB.prepare(
    `SELECT work_date, cantiere_code, cantiere_desc, updated_at
     FROM day_sheets
     WHERE work_date=?
     ORDER BY cantiere_desc`
  ).bind(date).all();

  return Response.json(r.results ?? []);
};
