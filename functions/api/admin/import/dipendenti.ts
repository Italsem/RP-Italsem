import { getUser, requireAdmin } from "../../_auth";

type Row = {
  Codice?: string;
  Nome?: string;
  Cognome?: string;
  Descrizione?: string;
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return new Response("Forbidden", { status: 403 });

  const body = await ctx.request.json();
  const rows: Row[] = Array.isArray(body?.rows) ? body.rows : [];

  let inserted = 0;

  await ctx.env.DB.prepare(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_dipendenti_codice ON dipendenti(codice);`
  ).run();

  const stmt = ctx.env.DB.prepare(
    `INSERT INTO dipendenti (codice, nome, cognome, descrizione)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(codice) DO UPDATE SET
       nome = excluded.nome,
       cognome = excluded.cognome,
       descrizione = excluded.descrizione;`
  );

  for (const r of rows) {
    const codice = String(r.Codice ?? "").trim();
    if (!codice) continue;

    const nome = String(r.Nome ?? "").trim();
    const cognome = String(r.Cognome ?? "").trim();
    const descrizione = String(r.Descrizione ?? "").trim();

    await stmt.bind(codice, nome, cognome, descrizione).run();
    inserted++;
  }

  return Response.json({ ok: true, inserted });
};
