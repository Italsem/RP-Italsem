import { json, badRequest, requireAuth } from "./_auth";

type OutRow = {
  data: string;
  cantiere_codice: string;
  tipo: string;
  risorsa_codice: string;
  risorsa_descrizione: string;
  ordinario: number;
  notturno: number;
  pioggia: number;
  malattia: number;
  trasferta: number;
  note: string;
};

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const a = await requireAuth(ctx);
  if (!a.ok) return a.res;

  const url = new URL(ctx.request.url);
  const from = (url.searchParams.get("from") || "").trim();
  const to = (url.searchParams.get("to") || "").trim();

  if (!from || !to) return badRequest("Missing from/to");
  if (from > to) return badRequest("Invalid range");

  const daySheets = await ctx.env.DB.prepare(
    `SELECT work_date, cantiere_code, payload
     FROM day_sheets
     WHERE work_date >= ? AND work_date <= ?
     ORDER BY work_date ASC, cantiere_code ASC`
  ).bind(from, to).all<any>();

  const out: OutRow[] = [];

  for (const s of daySheets.results || []) {
    const payload = JSON.parse(s.payload || "{}");
    for (const row of payload.rows || []) {
      const day = row.days?.[s.work_date] || {};
      out.push({
        data: s.work_date,
        cantiere_codice: row.cantiere || s.cantiere_code || "",
        tipo: row.tipo || row.type || "",
        risorsa_codice: row.codice || row.code || "",
        risorsa_descrizione: row.descrizione || row.desc || row.name || "",
        ordinario: Number(day.ordinario ?? row.ordinario ?? 0) || 0,
        notturno: Number(day.notturno ?? row.notturno ?? 0) || 0,
        pioggia: Number(day.pioggia ?? row.pioggia ?? 0) || 0,
        malattia: Number(day.malattia ?? row.malattia ?? 0) || 0,
        trasferta: Number(day.trasferta ?? row.trasferta ?? 0) || 0,
        note: String(day.note ?? row.note ?? ""),
      });
    }
  }

  if (out.length > 0) {
    out.sort((a, b) =>
      a.data.localeCompare(b.data) ||
      a.cantiere_codice.localeCompare(b.cantiere_codice) ||
      a.tipo.localeCompare(b.tipo) ||
      a.risorsa_codice.localeCompare(b.risorsa_codice)
    );
    return json({ ok: true, rows: out });
  }

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
