import { requireAdmin, json } from "../_auth";

type AnyRow = Record<string, any>;

const TABLES = ["users", "cantieri", "mezzi", "dipendenti", "rapportini"] as const;

function toDailyRows(rapportini: AnyRow[]) {
  const out: AnyRow[] = [];
  for (const item of rapportini) {
    let payload: any = null;
    try {
      payload = JSON.parse(item.payload || "{}");
    } catch {
      payload = null;
    }
    if (!payload) continue;

    for (const row of payload.rows ?? []) {
      for (const day of payload.days ?? []) {
        const dayData = row.days?.[day] ?? {};
        const ordinario = Number(dayData.ordinario ?? 0) || 0;
        const noteGiorno = (dayData.note ?? "").toString();
        if (!ordinario && !noteGiorno) continue;

        out.push({
          data: day,
          month: payload.month ?? item.month,
          tipo: row.type ?? "",
          cantiere: row.cantiere ?? "",
          codice: row.code ?? "",
          descrizione: row.name ?? "",
          note_riga: row.note ?? "",
          ordinario,
          note_giorno: noteGiorno,
          rapportino_id: item.id,
          creato_il: item.created_at,
          creato_da: item.created_by,
        });
      }
    }
  }

  return out.sort((a, b) => String(a.data).localeCompare(String(b.data)) || String(a.tipo).localeCompare(String(b.tipo)) || String(a.descrizione).localeCompare(String(b.descrizione)));
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const a = await requireAdmin(ctx);
  if (!a.ok) return a.res;

  const tables: Record<string, AnyRow[]> = {};

  for (const table of TABLES) {
    const r = await ctx.env.DB.prepare(`SELECT * FROM ${table}`).all<AnyRow>();
    tables[table] = r.results ?? [];
  }

  const rapportiniDaily = toDailyRows(tables.rapportini || []);

  return json({
    ok: true,
    generated_at: new Date().toISOString(),
    tables,
    rapportini_daily: rapportiniDaily,
  });
};
