import { getUser } from "../_auth";

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });

  const url = new URL(ctx.request.url);
  const date = url.searchParams.get("date");
  const code = url.searchParams.get("cantiere_code");
  if (!date || !code) return new Response("Missing params", { status: 400 });

  const row = await ctx.env.DB.prepare(
    `SELECT work_date, cantiere_code, cantiere_desc, payload, updated_at
     FROM day_sheets
     WHERE work_date=? AND cantiere_code=?`
  ).bind(date, code).first<any>();

  if (!row) return new Response("Not found", { status: 404 });

  return Response.json({
    work_date: row.work_date,
    cantiere_code: row.cantiere_code,
    cantiere_desc: row.cantiere_desc,
    payload: JSON.parse(row.payload),
    updated_at: row.updated_at,
  });
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });

  const { work_date, cantiere_code, cantiere_desc, payload } = await ctx.request.json();
  if (!work_date || !cantiere_code || !cantiere_desc || !payload) {
    return new Response("Missing fields", { status: 400 });
  }

  await ctx.env.DB.prepare(
    `INSERT INTO day_sheets (work_date, cantiere_code, cantiere_desc, payload, created_by, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(work_date, cantiere_code) DO UPDATE SET
       cantiere_desc=excluded.cantiere_desc,
       payload=excluded.payload,
       updated_at=datetime('now')`
  ).bind(work_date, cantiere_code, cantiere_desc, JSON.stringify(payload), u.id).run();

  return Response.json({ ok: true });
};
