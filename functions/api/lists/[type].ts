import { json } from "../_auth";

const MAP: Record<string, { table: string; code: string; descExpr: string }> = {
  cantieri: { table: "cantieri", code: "codice", descExpr: "descrizione" },
  mezzi: { table: "mezzi", code: "codice", descExpr: "descrizione" },
  dipendenti: { table: "dipendenti", code: "codice", descExpr: "trim(coalesce(cognome,'') || ' ' || coalesce(nome,''))" },
};

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const type = ctx.params.type?.toString() || "";
  const m = MAP[type];
  if (!m) return json({ ok: false, error: "Invalid list type" }, { status: 400 });

  const url = new URL(ctx.request.url);
  const q = (url.searchParams.get("q") || "").trim();

  let sql = `SELECT ${m.code} as codice, ${m.descExpr} as descrizione FROM ${m.table}`;
  const binds: any[] = [];
  if (q) {
    sql += ` WHERE ${m.code} LIKE ? OR ${m.descExpr} LIKE ?`;
    binds.push(`%${q}%`, `%${q}%`);
    sql += ` ORDER BY ${m.code} LIMIT 200`;
  } else {
    sql += ` ORDER BY ${m.code}`;
  }

  const rows = await ctx.env.DB.prepare(sql).bind(...binds).all<any>();
  let items = rows.results || [];
  if (type === "cantieri" && !items.find((x: any) => String(x.codice || "").toUpperCase() === "TIPO")) {
    items = [{ codice: "TIPO", descrizione: "TIPO" }, ...items];
  }
  return json({ ok: true, items });

};
