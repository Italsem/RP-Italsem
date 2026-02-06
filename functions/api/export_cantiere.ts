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

  const lines: string[] = [];
  lines.push(["Cantiere", "Voce", "Giornate/Qtà", "Note"].map(csvEscape).join(","));

  for (const doc of items) {
    for (const row of doc.rows ?? []) {
      const cantiere = row.cantiere || "";
      const voce = row.type;
      let sum = 0;
      for (const d of doc.days ?? []) sum += Number(row.days?.[d]?.ordinario ?? 0) || 0;
      const note = row.note || "";
      lines.push([cantiere, voce, sum, note].map(csvEscape).join(","));
    }
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8" },
  });
};
