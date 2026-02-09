import { getUser } from "./_auth";
import * as XLSX from "xlsx";

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

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });

  const month = new URL(ctx.request.url).searchParams.get("month");
  if (!month) return new Response("Missing month", { status: 400 });

  const r = await ctx.env.DB.prepare("SELECT payload FROM rapportini WHERE month=?").bind(month).all<any>();
  const items = (r.results ?? []).map((x: any) => JSON.parse(x.payload));
  const days = daysInMonth(month);

  const rows: any[][] = [];

  const head1 = ["", "", "", "", "", "", ""] as any[];
  const head2 = ["Cod. Progetto", "Cod. Categoria", "Des. Categoria", "Cod. D/A Az.", "Des. D/A Az.", "Cod. WBS", "Des. WBS"] as any[];
  for (const d of days) {
    head1.push(dayLabel(d), "", "", "", "", "");
    head2.push("Note", "Ordinario", "Notturno", "Pioggia", "Malattia", "Trasferta");
  }
  head1.push("Totale ore");
  head2.push("Totale ore");
  rows.push(head1, head2);

  for (const doc of items) {
    for (const row of doc.rows ?? []) {
      const out: any[] = [
        row.cantiere || "",
        "RpCos",
        "Rapportino costi",
        row.code || "",
        row.name || "",
        "MAN",
        "MANODOPERA",
      ];

      let total = 0;
      for (const d of days) {
        const note = row.days?.[d]?.note || "";
        const ord = Number(row.days?.[d]?.ordinario ?? 0) || 0;
        total += ord;
        out.push(note, ord, 0, 0, 0, 0);
      }
      out.push(total);
      rows.push(out);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  const merges: XLSX.Range[] = [];
  for (let c = 0; c <= 6; c++) merges.push({ s: { r: 0, c }, e: { r: 1, c } });
  for (let i = 0; i < days.length; i++) {
    const start = 7 + i * 6;
    merges.push({ s: { r: 0, c: start }, e: { r: 0, c: start + 5 } });
  }
  const totalCol = 7 + days.length * 6;
  merges.push({ s: { r: 0, c: totalCol }, e: { r: 1, c: totalCol } });
  ws["!merges"] = merges;

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
