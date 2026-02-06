import { getUser, requireAdmin } from "../_auth";

export async function guardAdmin(ctx: any) {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return { ok: false as const, res: new Response("Forbidden", { status: 403 }) };
  return { ok: true as const, user: u };
}

export async function listAll(ctx: any, table: string) {
  const q = await ctx.env.DB.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
  return Response.json(q.results ?? []);
}

export async function upsertRow(ctx: any, table: string) {
  const body = await ctx.request.json();
  const { id, ...rest } = body;

  // salva tutte le colonne che arrivano (v1 semplice)
  const keys = Object.keys(rest);
  if (keys.length === 0) return new Response("Missing fields", { status: 400 });

  if (id) {
    const setSql = keys.map((k) => `${k}=?`).join(", ");
    const binds = keys.map((k) => rest[k]);
    binds.push(id);
    await ctx.env.DB.prepare(`UPDATE ${table} SET ${setSql} WHERE id=?`).bind(...binds).run();
    return Response.json({ ok: true });
  }

  const cols = keys.join(", ");
  const qs = keys.map(() => "?").join(", ");
  const binds = keys.map((k) => rest[k]);
  await ctx.env.DB.prepare(`INSERT INTO ${table} (${cols}) VALUES (${qs})`).bind(...binds).run();
  return Response.json({ ok: true });
}

export async function deleteRow(ctx: any, table: string) {
  const { id } = await ctx.request.json();
  if (!id) return new Response("Missing id", { status: 400 });
  await ctx.env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();
  return Response.json({ ok: true });
}
