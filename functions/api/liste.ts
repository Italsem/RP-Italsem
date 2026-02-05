export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const tipo = url.searchParams.get("tipo"); // cantieri | mezzi | dipendenti

  let sql = "";
  if (tipo === "cantieri") sql = "SELECT codice, descrizione FROM cantieri ORDER BY codice";
  else if (tipo === "mezzi") sql = "SELECT codice, descrizione FROM mezzi ORDER BY codice";
  else if (tipo === "dipendenti") sql = "SELECT codice, nome, cognome, descrizione FROM dipendenti ORDER BY cognome, nome";
  else return new Response("Tipo non valido", { status: 400 });

  const res = await ctx.env.DB.prepare(sql).all();
  return Response.json(res.results);
};
