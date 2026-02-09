// functions/api/lists/[type].ts
import { json } from "../_auth";

const MAP: Record<string, { table: string; code: string; desc: string }> = {
  cantieri: { table: "cantieri", code: "codice", desc: "descrizione" },
  mezzi: { table: "mezzi", code: "codice", desc: "descrizione" },
  dipendenti: { table: "dipendenti", code: "codice", desc: "descrizione" },
};

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const type = ctx.params.type?.toString() || "";
  const m = MAP[type];
  if (!m) return json({ ok: false, error: "Invalid list type" }, { status: 400 });

  const url = new URL(ctx.request.url);
  const q = (url.searchParams.get("q") || "").trim();

  let sql = `SELECT ${m.code} as codice, ${m.desc} as descrizione FROM ${m.table}`;
  const binds: any[] = [];
  if (q) {
    sql += ` WHERE ${m.code} LIKE ? OR ${m.desc} LIKE ?`;
    binds.push(`%${q}%`, `%${q}%`);
  }
  sql += ` ORDER BY ${m.code} LIMIT 50`;

  const rows = await ctx.env.DB.prepare(sql).bind(...binds).all<any>();
  return json({ ok: true, items: rows.results || [] });
};
