export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const b = await ctx.request.json();

  // campi minimi
  const required = ["data", "cantiere_codice", "tipo", "risorsa_codice", "risorsa_descrizione"];
  for (const k of required) {
    if (!b[k]) return new Response(`Missing ${k}`, { status: 400 });
  }

  await ctx.env.DB.prepare(
    `INSERT INTO movimenti
     (data, cantiere_codice, tipo, risorsa_codice, risorsa_descrizione, note,
      ordinario, notturno, pioggia, malattia, trasferta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    b.data,
    b.cantiere_codice,
    b.tipo,
    b.risorsa_codice,
    b.risorsa_descrizione,
    b.note ?? "",
    b.ordinario ?? 0,
    b.notturno ?? 0,
    b.pioggia ?? 0,
    b.malattia ?? 0,
    b.trasferta ?? 0
  ).run();

  return Response.json({ ok: true });
};
