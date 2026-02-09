import { requireAdmin, json } from "../_auth";

type AnyRow = Record<string, any>;

const TABLES = ["users", "cantieri", "mezzi", "dipendenti", "rapportini", "day_sheets"] as const;

function hasAnyPresence(day: AnyRow) {
  return ["ordinario", "notturno", "pioggia", "malattia", "trasferta"].some((k) => Number(day?.[k] ?? 0) !== 0);
}

function safeJsonParse(payload: string | null | undefined) {
  try {
    return JSON.parse(payload || "{}");
  } catch {
    return null;
  }
}

function fromDaySheets(daySheets: AnyRow[]) {
  const out: AnyRow[] = [];

  for (const item of daySheets) {
    const payload = safeJsonParse(item.payload);
    if (!payload) continue;

    for (const row of payload.rows ?? []) {
      const day = {
        ordinario: Number(row.ordinario ?? 0) || 0,
        notturno: Number(row.notturno ?? 0) || 0,
        pioggia: Number(row.pioggia ?? 0) || 0,
        malattia: Number(row.malattia ?? 0) || 0,
        trasferta: Number(row.trasferta ?? 0) || 0,
        note: String(row.note ?? ""),
      };

      if (!hasAnyPresence(day) && !day.note) continue;

      out.push({
        data: item.work_date,
        cantiere_code: item.cantiere_code,
        cantiere_desc: item.cantiere_desc,
        tipo: row.type ?? "",
        codice: row.code ?? "",
        descrizione: row.desc ?? "",
        note_riga: row.note ?? "",
        ordinario: day.ordinario,
        notturno: day.notturno,
        pioggia: day.pioggia,
        malattia: day.malattia,
        trasferta: day.trasferta,
      });
    }
  }

  return out;
}

function fromRapportini(rapportini: AnyRow[]) {
  const out: AnyRow[] = [];

  for (const item of rapportini) {
    const payload = safeJsonParse(item.payload);
    if (!payload) continue;

    for (const row of payload.rows ?? []) {
      for (const dayKey of payload.days ?? []) {
        const day = row.days?.[dayKey] ?? {};
        const normalized = {
          ordinario: Number(day.ordinario ?? row.ordinario ?? 0) || 0,
          notturno: Number(day.notturno ?? row.notturno ?? 0) || 0,
          pioggia: Number(day.pioggia ?? row.pioggia ?? 0) || 0,
          malattia: Number(day.malattia ?? row.malattia ?? 0) || 0,
          trasferta: Number(day.trasferta ?? row.trasferta ?? 0) || 0,
          note: String(day.note ?? row.note ?? ""),
        };

        if (!hasAnyPresence(normalized) && !normalized.note) continue;

        out.push({
          data: dayKey,
          cantiere_code: row.cantiere || "",
          cantiere_desc: row.cantiere || "",
          tipo: row.type ?? "",
          codice: row.code ?? "",
          descrizione: row.name ?? "",
          note_riga: row.note ?? "",
          ordinario: normalized.ordinario,
          notturno: normalized.notturno,
          pioggia: normalized.pioggia,
          malattia: normalized.malattia,
          trasferta: normalized.trasferta,
        });
      }
    }
  }

  return out;
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const a = await requireAdmin(ctx);
  if (!a.ok) return a.res;

  const tables: Record<string, AnyRow[]> = {};

  for (const table of TABLES) {
    try {
      const r = await ctx.env.DB.prepare(`SELECT * FROM ${table}`).all<AnyRow>();
      tables[table] = r.results ?? [];
    } catch {
      tables[table] = [];
    }
  }

  const fromDaily = fromDaySheets(tables.day_sheets || []);
  const fromMonthly = fromRapportini(tables.rapportini || []);
  const rapportiniDaily = (fromDaily.length ? fromDaily : fromMonthly).sort((a, b) => {
    const byDate = String(a.data).localeCompare(String(b.data));
    if (byDate) return byDate;
    const byCantiere = String(a.cantiere_code).localeCompare(String(b.cantiere_code));
    if (byCantiere) return byCantiere;
    return String(a.descrizione).localeCompare(String(b.descrizione));
  });

  return json({
    ok: true,
    generated_at: new Date().toISOString(),
    tables,
    rapportini_daily: rapportiniDaily,
    source: fromDaily.length ? "day_sheets" : "rapportini",
  });
};
