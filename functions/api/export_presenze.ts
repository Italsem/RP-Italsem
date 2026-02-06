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

  // payload schema v1: { rows: [...], days: [...] }
  // produciamo presenze per dipendente sommando "ordinario" per giorno (g = 1 giornata)
  const map: Record<string, number> = {};

  for (const doc of items) {
    for (const row of doc.rows ?? []) {
      if (row.type !== "DIP") continue;
      const key = row.name || row.code || "SENZA_NOME";
      let sum = 0;
      for (const d of doc.days ?? []) {
        const v = row.days?.[d]?.ordinario ?? 0;
        sum += Number(v) || 0;
      }
      map[key] = (map[key] ?? 0) + sum;
    }
  }

  const lines = [
    ["Dipendente", "Giornate"].map(csvEscape).join(","),
    ...Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => [k, v].map(csvEscape).join(",")),
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8" },
  });
};
