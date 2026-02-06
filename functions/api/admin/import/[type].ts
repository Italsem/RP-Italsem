import { getUser, requireAdmin } from "../../_auth";

const allowed = new Set(["cantieri", "mezzi", "dipendenti"]);

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return new Response("Forbidden", { status: 403 });

  const type = ctx.params.type;
  if (!allowed.has(type)) return new Response("Bad type", { status: 400 });

  const { rows } = await ctx.request.json();
  if (!Array.isArray(rows)) return new Response("Missing rows", { status: 400 });

  // svuoto e reimporto (v1 semplice e pulita)
  await ctx.env.DB.prepare(`DELETE FROM ${type}`).run();

  if (type === "dipendenti") {
    const stmt = ctx.env.DB.prepare(
      `INSERT INTO dipendenti (Codice, Nome, Cognome, Descrizione) VALUES (?, ?, ?, ?)`
    );
    for (const r of rows) {
      await stmt.bind(r.Codice ?? "", r.Nome ?? "", r.Cognome ?? "", r.Descrizione ?? "").run();
    }
  } else {
    const stmt = ctx.env.DB.prepare(
      `INSERT INTO ${type} (Codice, Descrizione) VALUES (?, ?)`
    );
    for (const r of rows) {
      await stmt.bind(r.Codice ?? "", r.Descrizione ?? "").run();
    }
  }

  return Response.json({ ok: true, count: rows.length });
};
