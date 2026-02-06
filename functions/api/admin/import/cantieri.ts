import { getUser, requireAdmin } from "../../_auth";

type Row = { Codice?: string; Descrizione?: string };

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return new Response("Forbidden", { status: 403 });

  const body = await ctx.request.json();
  const rows: Row[] = Array.isArray(body?.rows) ? body.rows : [];

  let inserted = 0;

  // ✅ prova a creare indice unico (non rompe se già esiste)
  await ctx.env.DB.prepare(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_cantieri_codice ON cantieri(codice);`
  ).run();

  const stmt = ctx.env.DB.prepare(
    `INSERT INTO cantieri (codice, descrizione)
     VALUES (?, ?)
     ON CONFLICT(codice) DO UPDATE SET descrizione = excluded.descrizione;`
  );

  for (const r of rows) {
    const codice = String(r.Codice ?? "").trim();
    const descrizione = String(r.Descrizione ?? "").trim();
    if (!codice) continue;

    await stmt.bind(codice, descrizione).run();
    inserted++;
  }

  return Response.json({ ok: true, inserted });
};
