import { getUser } from "../_auth";

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });

  const { from_date, to_date, cantiere_code } = await ctx.request.json<any>();
  if (!from_date || !to_date) return new Response("Missing from_date/to_date", { status: 400 });
  if (from_date === to_date) return new Response("Le date devono essere diverse", { status: 400 });

  const cantiereCode = String(cantiere_code || "").trim();
  const whereCantiere = cantiereCode ? " AND cantiere_code=?" : "";
  const binds = cantiereCode ? [from_date, cantiereCode] : [from_date];

  const src = await ctx.env.DB.prepare(
    `SELECT cantiere_code, cantiere_desc, payload
     FROM day_sheets
     WHERE work_date=?${whereCantiere}`
  ).bind(...binds).all<any>();

  const rows = src.results || [];
  if (rows.length === 0) {
    const msg = cantiereCode
      ? `Nessun cantiere ${cantiereCode} trovato nella data sorgente`
      : "Nessun cantiere trovato nella data sorgente";
    return new Response(msg, { status: 404 });
  }

  for (const r of rows) {
    await ctx.env.DB.prepare(
      `INSERT INTO day_sheets (work_date, cantiere_code, cantiere_desc, payload, created_by, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(work_date, cantiere_code) DO UPDATE SET
         cantiere_desc=excluded.cantiere_desc,
         payload=excluded.payload,
         updated_at=datetime('now')`
    ).bind(to_date, r.cantiere_code, r.cantiere_desc, r.payload, u.id).run();
  }

  return Response.json({ ok: true, copied: rows.length, cantiere_code: cantiereCode || null });
};
