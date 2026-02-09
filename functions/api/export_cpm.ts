import { getUser } from "./_auth";

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });

  const month = new URL(ctx.request.url).searchParams.get("month");
  if (!month) return new Response("Missing month", { status: 400 });

  const r = await ctx.env.DB.prepare("SELECT payload FROM rapportini WHERE month=?").bind(month).all();
  const items = (r.results ?? []).map((x: any) => JSON.parse(x.payload));

  const header = ["DATA", "CANTIERE", "TIPO", "CODICE", "DESCR", "ORDINARIO", "NOTE"];
  const lines: string[] = [header.map(csvEscape).join(",")];

  for (const doc of items) {
    for (const row of doc.rows ?? []) {
      const cantiere = row.cantiere || "";
      const tipo = row.type || "";
      const codice = row.code || "";
      const descr = row.name || "";
      const noteBase = row.note || "";

      for (const d of doc.days ?? []) {
        const ord = Number(row.days?.[d]?.ordinario ?? 0) || 0;
        const noteDay = row.days?.[d]?.note || "";
        lines.push([
          d,
          cantiere,
          tipo,
          codice,
          descr,
          ord === 0 ? "" : ord,
          (noteBase + " " + noteDay).trim(),
        ].map(csvEscape).join(","));
      }
    }
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8" },
  });
};
