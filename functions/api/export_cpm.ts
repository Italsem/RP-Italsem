import { getUser } from "./_auth";
import * as XLSX from "xlsx";

type DayVals = { note: string; ordinario: number; notturno: number; pioggia: number; malattia: number; trasferta: number };

type AccRow = {
  progetto: string;
  codDA: string;
  desDA: string;
  days: Record<string, DayVals>;
};

function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const out: string[] = [];
  for (let i = 1; i <= last; i++) out.push(`${month}-${String(i).padStart(2, "0")}`);
  return out;
}

function dayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
}

function getRowDay(row: any, day: string): DayVals {
  const d = row?.days?.[day] || {};
  return {
    note: String(d.note ?? row.note ?? ""),
    ordinario: Number(d.ordinario ?? row.ordinario ?? 0) || 0,
    notturno: Number(d.notturno ?? row.notturno ?? 0) || 0,
    pioggia: Number(d.pioggia ?? row.pioggia ?? 0) || 0,
    malattia: Number(d.malattia ?? row.malattia ?? 0) || 0,
    trasferta: Number(d.trasferta ?? row.trasferta ?? 0) || 0,
  };
}

function addOrMerge(map: Map<string, AccRow>, day: string, progetto: string, rawCode: any, rawDesc: any, row: any) {
  const codDA = String(rawCode ?? "").trim() || (row?.type === "HOTEL" ? "H01" : "");
  const desDA = String(rawDesc ?? "").trim() || (row?.type === "HOTEL" ? "HOTEL 01" : "");
  const proj = String(progetto || "").trim() || "TIPO";
  const key = `${proj}|${codDA}|${desDA}`;

  const cur = map.get(key) || { progetto: proj, codDA, desDA, days: {} };
  cur.days[day] = getRowDay(row, day);
  map.set(key, cur);
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });

  const month = new URL(ctx.request.url).searchParams.get("month");
  if (!month) return new Response("Missing month", { status: 400 });

  const days = daysInMonth(month);
  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  const acc = new Map<string, AccRow>();

  const daySheets = await ctx.env.DB.prepare(
    `SELECT work_date, cantiere_code, payload
     FROM day_sheets
     WHERE work_date >= ? AND work_date <= ?
     ORDER BY work_date ASC, cantiere_code ASC`
  ).bind(firstDay, lastDay).all<any>();

  for (const s of daySheets.results || []) {
    const payload = JSON.parse(s.payload || "{}");
    const rows = payload.rows || [];
    for (const row of rows) {
      addOrMerge(
        acc,
        s.work_date,
        row.cantiere || s.cantiere_code || "TIPO",
        row.codice ?? row.code,
        row.descrizione ?? row.desc ?? row.name,
        row
      );
    }
  }

  if (acc.size === 0) {
    const rapports = await ctx.env.DB.prepare("SELECT payload FROM rapportini WHERE month=?").bind(month).all<any>();
    const items = (rapports.results ?? []).map((x: any) => JSON.parse(x.payload));
    for (const doc of items) {
      const docDays = doc.days || days;
      for (const row of doc.rows ?? []) {
        for (const d of docDays) {
          if (!days.includes(d)) continue;
          addOrMerge(acc, d, row.cantiere || "TIPO", row.code, row.name, row);
        }
      }
    }
  }

  const aoa: any[][] = [];
  const rowTop = ["", "", "", "", "", "", ""] as any[];
  const rowHead = ["Cod. Progetto", "Cod. Categoria", "Des. Categoria", "Cod. D/A Az.", "Des. D/A Az.", "Cod. WBS", "Des. WBS"] as any[];

  for (const d of days) {
    rowTop.push(dayLabel(d), "", "", "", "", "");
    rowHead.push("Note", "Ordinario", "Notturno", "Pioggia", "Malattia", "Trasferta");
  }
  rowTop.push("Totale ore");
  rowHead.push("Totale ore");
  aoa.push(rowTop, rowHead);

  const rows = Array.from(acc.values()).sort((a, b) =>
    a.progetto.localeCompare(b.progetto) || a.codDA.localeCompare(b.codDA) || a.desDA.localeCompare(b.desDA)
  );

  for (const r of rows) {
    const out: any[] = [r.progetto, "RpCos", "Rapportino costi", r.codDA, r.desDA, "MAN", "MANODOPERA"];
    let total = 0;

    for (const d of days) {
      const v = r.days[d] || { note: "", ordinario: 0, notturno: 0, pioggia: 0, malattia: 0, trasferta: 0 };
      out.push(v.note, v.ordinario, v.notturno, v.pioggia, v.malattia, v.trasferta);
      total += v.ordinario + v.notturno + v.pioggia + v.malattia + v.trasferta;
    }

    out.push(total);
    aoa.push(out);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const merges: XLSX.Range[] = [];
  for (let i = 0; i < days.length; i++) {
    const c0 = 7 + i * 6;
    merges.push({ s: { r: 0, c: c0 }, e: { r: 0, c: c0 + 5 } });
  }
  ws["!merges"] = merges;

  const totalCol = 7 + days.length * 6;
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 1, c: 0 }, e: { r: 1, c: totalCol } }) };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet");

  const arr = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Response(arr, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="export_cpm_${month}.xlsx"`,
    },
  });
};
