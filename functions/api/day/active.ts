import { getUser } from "../_auth";

function toNum(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function isDipType(v: unknown) {
  const t = String(v ?? "").toUpperCase();
  return t === "DIP" || t === "DIPENDENTE";
}

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
    let operai_totals = {
      ordinario: 0,
      trasferta: 0,
      notturno: 0,
      malattia: 0,
      pioggia: 0,
    };
    try {
      const p = JSON.parse(x.payload || "{}");
      internal_desc = String(p.internal_desc || "").trim();
      const rows = Array.isArray(p.rows) ? p.rows : [];
      operai_totals = rows.reduce(
        (acc: typeof operai_totals, row: any) => {
          if (!isDipType(row?.type)) return acc;
          acc.ordinario += toNum(row?.ordinario);
          acc.trasferta += toNum(row?.trasferta);
          acc.notturno += toNum(row?.notturno);
          acc.malattia += toNum(row?.malattia);
          acc.pioggia += toNum(row?.pioggia);
          return acc;
        },
        { ...operai_totals }
      );
    } catch {}
    return {
      work_date: x.work_date,
      cantiere_code: x.cantiere_code,
      cantiere_desc: x.cantiere_desc,
      internal_desc,
      operai_totals,
      updated_at: x.updated_at,
    };
  });

  return Response.json(out);
};
