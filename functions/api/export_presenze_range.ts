// functions/api/export_presenze_range.ts
import { json, badRequest, requireAuth } from "./_auth";

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const a = await requireAuth(ctx);
  if (!a.ok) return a.res;

  const url = new URL(ctx.request.url);
  const from = (url.searchParams.get("from") || "").trim();
  const to = (url.searchParams.get("to") || "").trim();

  if (!from || !to) return badRequest("Missing from/to");
  if (from > to) return badRequest("Invalid range");

  // Nota: assumo data salvata come YYYY-MM-DD in movimenti.data
  const rows = await ctx.env.DB.prepare(
    `SELECT
        data,
        cantiere_codice,
        tipo,
        risorsa_codice,
        risorsa_descrizione,
        ordinario,
        notturno,
        pioggia,
        malattia,
        trasferta,
        note
     FROM movimenti
     WHERE data >= ? AND data <= ?
     ORDER BY data ASC, cantiere_codice ASC, tipo ASC, risorsa_codice ASC`
  ).bind(from, to).all<any>();

  return json({ ok: true, rows: rows.results || [] });
};
