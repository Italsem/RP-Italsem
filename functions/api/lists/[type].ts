import { getUser } from "../_auth";

const allowed = new Set(["cantieri", "mezzi", "dipendenti"]);

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });

  const type = ctx.params.type;
  if (!allowed.has(type)) return new Response("Bad type", { status: 400 });

  const r = await ctx.env.DB.prepare(`SELECT * FROM ${type} ORDER BY id`).all();
  return Response.json(r.results ?? []);
};
