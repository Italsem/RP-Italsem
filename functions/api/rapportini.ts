import { getUser } from "./_auth";

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });

  const month = new URL(ctx.request.url).searchParams.get("month");
  if (!month) return new Response("Missing month", { status: 400 });

  const r = await ctx.env.DB.prepare(
    "SELECT id, month, created_by, created_at, payload FROM rapportini WHERE month=? ORDER BY created_at DESC"
  ).bind(month).all();

  return Response.json(r.results ?? []);
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });

  const { month, payload } = await ctx.request.json();
  if (!month || !payload) return new Response("Missing fields", { status: 400 });

  await ctx.env.DB.prepare(
    "INSERT INTO rapportini (month, created_by, payload) VALUES (?, ?, ?)"
  ).bind(month, u.id, JSON.stringify(payload)).run();

  return Response.json({ ok: true });
};
